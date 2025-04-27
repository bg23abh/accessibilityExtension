// Listen for incoming messages from main thread
self.onmessage = function (e) {
  try {
    // Receive the text data from the message
    const text = e.data;
    // Transform the text word-by-word
    const transformed = text
      .split(" ") // Split the full text into words
      .map((word) => {
        if (word.length < 1) return word; // Skip empty words

        // Preserve punctuation (basic)
        const match = word.match(/^(\W*)(\w+)(\W*)$/);
        if (!match) return word; // If no match, leave word as is

        const [, prefix, core, suffix] = match;
        const boldCount = Math.ceil(core.length * 0.4); // Calculate bold count (40% of the word length)
        const bolded = `<b>${core.slice(0, boldCount)}</b>${core.slice(
          boldCount
        )}`; // Bold the first 40% of the word
        return `${prefix}${bolded}${suffix}`; // Reconstruct the word with prefix and suffix
      })
      .join(" "); // Join transformed words back into full text
    self.postMessage(transformed); // Send the transformed text back to the main thread
  } catch (error) {
    // If any error occurs during processing, log it
    console.log(error);
    self.postMessage("Error occured"); // Return an error message back to main thread
  }
};
