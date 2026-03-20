import sys

with open('src/components/dashboard/DashboardGuide.tsx', 'r') as f:
    lines = f.readlines()

brace_count = 0
bracket_count = 0
paren_count = 0

for i, line in enumerate(lines):
    b_open = line.count('{')
    b_close = line.count('}')
    sq_open = line.count('[')
    sq_close = line.count(']')
    p_open = line.count('(')
    p_close = line.count(')')
    
    brace_count += b_open - b_close
    bracket_count += sq_open - sq_close
    paren_count += p_open - p_close
    
    if brace_count < 0:
        print(f"Brace Underflow at line {i+1}: {line.strip()}")
        break
    if bracket_count < 0:
        print(f"Bracket Underflow at line {i+1}: {line.strip()}")
        break
    if paren_count < 0:
        print(f"Paren Underflow at line {i+1}: {line.strip()}")
        # break

print(f"Final Counts - Brace: {brace_count}, Bracket: {bracket_count}, Paren: {paren_count}")
if brace_count == 0 and bracket_count == 0 and paren_count == 0:
    print("Balanced!")
else:
    print("Imbalanced!")
