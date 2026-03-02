import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { AiAgentSystemName, AiActionStatus } from '@/generated/client'

export interface AiProposalPayload {
    agentSystemName: AiAgentSystemName
    actionType: string
    payloadAfter: any
    payloadBefore?: any
}

/**
 * Creates a pending AI action record. No direct DB mutation happens here.
 * This follows the "AI Proposes, Admin Disposes" principle.
 */
export async function proposeAiAction(data: AiProposalPayload) {
    const agent = await db.aiAgent.findUnique({
        where: { systemName: data.agentSystemName },
        include: { permissions: true }
    })

    if (!agent) throw new Error(`Agent ${data.agentSystemName} not found`)

    // Permission Checks (Simplified for infrastructure setup)
    if (data.actionType.includes('PRODUCT') && !agent.permissions?.canModifyProducts) {
        throw new Error(`Agent ${data.agentSystemName} does not have permission to modify products`)
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    return await db.aiAction.create({
        data: {
            agentId: agent.id,
            actionType: data.actionType,
            payloadBefore: data.payloadBefore || null,
            payloadAfter: data.payloadAfter,
            status: 'PENDING' as AiActionStatus,
            expiresAt,
        },
    })
}

/**
 * Executes a previously approved AI action within a transaction.
 */
export async function executeAiAction(actionId: string, adminId: string) {
    return await db.$transaction(async (tx) => {
        const action = await tx.aiAction.findUnique({
            where: { id: actionId },
            include: { agent: true }
        })

        if (!action) throw new Error('AI Action not found')
        if (action.status !== 'PENDING') throw new Error(`Action is already ${action.status}`)

        const payload = action.payloadAfter as any

        // Execution Dispatcher
        switch (action.actionType) {
            case 'UPDATE_PRODUCT':
                await tx.product.update({
                    where: { id: payload.id },
                    data: payload.data
                })
                break

            case 'UPDATE_ORDER_STATUS':
                await tx.order.update({
                    where: { id: payload.orderId },
                    data: { status: payload.status }
                })
                break

            case 'CREATE_PACKAGE':
                await tx.rentalPackage.create({
                    data: payload
                })
                break

            case 'UPDATE_ADDRESSING_RULES':
                await tx.siteSetting.upsert({
                    where: { section_key: { section: 'ai', key: 'addressing_rules' } },
                    update: { value: payload.addressingRules },
                    create: { section: 'ai', key: 'addressing_rules', value: payload.addressingRules }
                })
                break

            default:
                throw new Error(`Unsupported AI action type: ${action.actionType}`)
        }

        const updatedAction = await tx.aiAction.update({
            where: { id: actionId },
            data: {
                status: 'EXECUTED' as AiActionStatus,
                approvedBy: adminId,
                executedAt: new Date()
            }
        })

        await tx.aiTrainingData.create({
            data: {
                agentId: action.agentId,
                suggestion: JSON.stringify({ type: action.actionType, payload: payload }),
                adminDecision: 'APPROVED'
            }
        })

        await tx.activityLog.create({
            data: {
                userId: adminId,
                action: 'AI_ACTION_EXECUTED',
                entity: 'AI_ACTION',
                details: `Executed ${action.actionType} proposed by ${action.agent.systemName} AI.`
            }
        })

        return updatedAction
    })
}

/**
 * Logs data for the learning layer (Feedback Loop).
 */
export async function logAiLearning(agentId: string, suggestion: string, decision: 'APPROVED' | 'REJECTED', score?: number) {
    return await db.aiTrainingData.create({
        data: {
            agentId,
            suggestion,
            adminDecision: decision,
            feedbackScore: score
        }
    })
}
