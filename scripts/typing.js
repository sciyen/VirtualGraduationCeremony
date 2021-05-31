const resolver = {
    resolve: function resolve(options, callback) {
        // The string to resolve
        const resolveString = options.resolveString || options.element.getAttribute('data-target-resolver');
        const combinedOptions = Object.assign({}, options, { resolveString: resolveString });

        function getRandomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        function randomCharacter(characters) {
            return characters[getRandomInteger(0, characters.length - 1)];
        };

        function doRandomiserEffect(options, callback) {
            const characters = options.characters;
            const timeout = options.timeout;
            const element = options.element;
            const partialString = options.partialString;

            let iterations = options.iterations;

            setTimeout(() => {
                if (iterations >= 0) {
                    const nextOptions = Object.assign({}, options, { iterations: iterations - 1 });

                    // Ensures partialString without the random character as the final state.
                    if (iterations === 0) {
                        element.textContent = partialString;
                    } else {
                        // Replaces the last character of partialString with a random character
                        element.textContent = partialString.substring(0, partialString.length - 1) + randomCharacter(characters);
                    }

                    doRandomiserEffect(nextOptions, callback)
                } else if (typeof callback === "function") {
                    callback();
                }
            }, options.timeout);
        };

        function doResolverEffect(options, callback) {
            const resolveString = options.resolveString;
            const characters = options.characters;
            const offset = options.offset;
            const partialString = resolveString.substring(0, offset);
            const combinedOptions = Object.assign({}, options, { partialString: partialString });

            doRandomiserEffect(combinedOptions, () => {
                const nextOptions = Object.assign({}, options, { offset: offset + 1 });

                if (offset <= resolveString.length) {
                    doResolverEffect(nextOptions, callback);
                } else if (typeof callback === "function") {
                    callback();
                }
            });
        };

        doResolverEffect(combinedOptions, callback);
    }
}

/* Some GLaDOS quotes from Portal 2 chapter 9: The Part Where He Kills You
 * Source: http://theportalwiki.com/wiki/GLaDOS_voice_lines#Chapter_9:_The_Part_Where_He_Kills_You
 */
const strings = [
    '不管四年過程是什麼，我們都要為自己的這段過程下個總結。',
    '重新找到活著的目標是什麼、存在的價值是什麼，那些我們可能都遺忘許久的初衷。',
    '不管中間我們的選擇對不對，重要的是這些過程對自己的影響，重新審視、重新出發。',
    '也許因為疫情停辦的畢典，讓我們有更多時間思考畢業的本質。',
    '為過去的自己劃一個總結，然後往下一個目標邁進。'
];

let counter = 0;

const options = {
    // Initial position
    offset: 0,
    // Timeout between each random character
    timeout: 5,
    // Number of random characters to show
    iterations: 10,
    // Random characters to pick from
    characters: ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'r', 's', 't', 'u', 'v', 'x', 'y', 'x', '#', '%', '&', '-', '+', '_', '?', '/', '\\', '='],
    // String to resolve
    resolveString: strings[counter],
    // The element
    element: document.querySelector('[data-target-resolver]')
}

// Callback function when resolve completes
function callback() {
    setTimeout(() => {
        counter++;

        if (counter >= strings.length) {
            counter = 0;
        }

        let nextOptions = Object.assign({}, options, { resolveString: strings[counter] });
        resolver.resolve(nextOptions, callback);
    }, 1000);
}

resolver.resolve(options, callback);