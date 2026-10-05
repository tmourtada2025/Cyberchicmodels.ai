const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

// "Four", "Eleven"; digits past twelve.
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n)
}
