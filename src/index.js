import IDE from './IDE';
import './index.scss';
// import {InputSystem} from './Input';
// import {Tokenizer} from './Tokenizer'

// let input = new InputSystem(`
//   # this is a comment
//   println("Hello World!");
//   println(2 + 3 * 4);
//   fib = lambda (n) if n < 2 then n else fib(n - 1) + fib(n - 2);
//   println(fib(15));
//   print-range = λ(a, b)
//                   if a <= b then {
//                     print(a);
//                     if a + 1 <= b {
//                       print(", ");
//                       print-range(a + 1, b);
//                     } else println("");
//                   };
//   print-range(1, 5);
// `)

// let lexer = new Tokenizer(input)
// while (!lexer.eof()) {
//     console.log(lexer.next())
// }

window.ide = new IDE();


