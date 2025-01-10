import React, { useState } from 'react';

interface GameOverProps {
    won: boolean;
    word: string;
    attempts: number;
    onPlayAgain: () => void;
    onShowLeaderboard: () => void;
    onSubmitScore?: (name: string) => void;
}

export default function GameOver({ won, word, attempts, onPlayAgain, onShowLeaderboard, onSubmitScore }: GameOverProps) {
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim() && onSubmitScore) {
            onSubmitScore(playerName.trim());
            setSubmitted(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
                <h2 className="text-3xl font-bold mb-4">
                    {won ? '🎉 Congratulations!' : '😔 Game Over'}
                </h2>

                <p className="text-xl mb-2">
                    The word was: <span className="font-bold text-green-600">{word.toUpperCase()}</span>
                </p>

                <p className="text-gray-600 mb-6">
                    {won
                        ? `You won in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`
                        : "Better luck next time!"}
                </p>

                {won && !submitted && onSubmitScore && (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full p-2 border rounded mb-2"
                            maxLength={20}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
                        >
                            Submit Score
                        </button>
                    </form>
                )}

                <div className="space-y-2">
                    <button
                        onClick={onPlayAgain}
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Play Again
                    </button>

                    <button
                        onClick={onShowLeaderboard}
                        className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors"
                    >
                        View Leaderboard
                    </button>
                </div>
            </div>
        </div>
    );
} 