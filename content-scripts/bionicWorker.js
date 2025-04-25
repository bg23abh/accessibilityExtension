self.onmessage = function (e) {
    try {
        const text = e.data;      
        const transformed = text
        .split(" ")
        .map((word) => {
          if (word.length < 1) return word;
    
          // Preserve punctuation (basic)
          const match = word.match(/^(\W*)(\w+)(\W*)$/);
          if (!match) return word;
    
          const [, prefix, core, suffix] = match;
          const boldCount = Math.ceil(core.length * 0.4);
          const bolded = `<b>${core.slice(0, boldCount)}</b>${core.slice(
            boldCount
          )}`;
          return `${prefix}${bolded}${suffix}`;
        })
        .join(" ");
        self.postMessage(transformed);
    } catch (error) {
        console.log(error);
        self.postMessage("Error occured");
    }
  };