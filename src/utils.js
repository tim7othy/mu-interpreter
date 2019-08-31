export const is_whitespace = (ch) => ch.charCodeAt(0) === 160 || /[ \n\t]/.test(ch)

export const is_digit = (ch) => /[0-9]/.test(ch)

export const is_id_start = (ch) => /[a-zλ_]/.test(ch)

export const is_id = (ch) => /[a-zA-Z0-9λ_]/.test(ch)

export const is_op_char = (ch) => "+-*/%=&|<>!".indexOf(ch) >= 0

export const is_punc = (ch) => ",;(){}[]".indexOf(ch) >= 0
