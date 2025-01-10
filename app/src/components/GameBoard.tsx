interface GameBoardProps {
    guesses: string[];
    results: string[][];
    currentGuess: string;
}

export default function GameBoard({ guesses, results, currentGuess }: GameBoardProps) {
    const emptyRows = 6 - guesses.length - 1;

    return (
        <div className="grid gap-2">
            {guesses.map((guess, i) => (
                <div key={i} className="grid grid-cols-5 gap-2">
                    {guess.split('').map((letter, j) => (
                        <div
                            key={j}
                            className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded
                ${results[i][j] === 'correct' ? 'bg-green-500 text-white border-green-600' :
                                    results[i][j] === 'present' ? 'bg-yellow-500 text-white border-yellow-600' :
                                        'bg-gray-500 text-white border-gray-600'}`}
                        >
                            {letter.toUpperCase()}
                        </div>
                    ))}
                </div>
            ))}

            {/* Current guess row */}
            <div className="grid grid-cols-5 gap-2">
                {currentGuess.split('').map((letter, i) => (
                    <div
                        key={i}
                        className="w-14 h-14 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold rounded"
                    >
                        {letter.toUpperCase()}
                    </div>
                ))}
                {[...Array(5 - currentGuess.length)].map((_, i) => (
                    <div
                        key={i}
                        className="w-14 h-14 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold rounded"
                    />
                ))}
            </div>

            {/* Empty rows */}
            {[...Array(emptyRows)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, j) => (
                        <div
                            key={j}
                            className="w-14 h-14 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold rounded"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
} 