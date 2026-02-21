"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartItemType = 'PRODUCT' | 'PACKAGE'

export interface CartItem {
    id: string
    type: CartItemType
    name: string
    price: number
    duration?: number // in days
    image?: string | null
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    clearCart: () => void
    itemCount: number
    totalPrice: number
    isEmpty: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart from local storage', e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('cart', JSON.stringify(items))
        }
    }, [items, isInitialized])

    const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
        setItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id)

            if (existingItemIndex > -1) {
                // Item exists, increment quantity (optional, or just ignore if strict unique)
                // For this requirement ("Added"), we might just want to ensure it's in the list.
                // But standard cart behavior usually increments. Let's increment.
                const updatedItems = [...prevItems]
                updatedItems[existingItemIndex].quantity += 1
                return updatedItems
            } else {
                return [...prevItems, { ...newItem, quantity: 1 }]
            }
        })
    }

    const removeItem = (id: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id))
    }

    const clearCart = () => {
        setItems([])
    }

    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                clearCart,
                itemCount,
                totalPrice,
                isEmpty: items.length === 0,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
