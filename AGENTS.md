# Project RTL rule

For Arabic text on iOS React Native, keep `writingDirection: 'rtl'` but use `textAlign: 'left'`. Using `textAlign: 'right'` with RTL writing direction can visually pin Arabic labels to the left. Give text nodes a full width when edge alignment matters.

# Layout ownership rule

When asked to remove side space around cards, change the parent list/container gutter only. Do not change the cards' own width, margins, padding, radius, borders, or shadows unless explicitly requested.
