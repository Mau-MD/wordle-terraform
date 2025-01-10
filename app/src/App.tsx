import { useState, useEffect } from 'react';
import axios from 'axios';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';

const API_URL = import.meta.env.VITE_API_URL ? 'https://' + import.meta.env.VITE_API_URL + '/api' : 'http://localhost:3000/api';

interface Score {
  name: string;
  attempts: number;
  time: number;
  date: string;
}

export default function App() {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [results, setResults] = useState<string[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState<Record<string, string>>({});
  const [currentWord, setCurrentWord] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [serverVersion, setServerVersion] = useState<string>('');

  useEffect(() => {
    startNewGame();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await axios.get(`${API_URL}/version`);
        setServerVersion(response.data.version);
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };
    fetchVersion();
  }, []);

  const startNewGame = async () => {
    try {
      await axios.get(`${API_URL}/word`);
      setCurrentWord('');
      setGuesses([]);
      setResults([]);
      setCurrentGuess('');
      setGameOver(false);
      setMessage('');
      setUsedLetters({});
      setGameWon(false);
    } catch (error) {
      console.error('Error starting new game:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/leaderboard`);
      setScores(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const updateUsedLetters = (guess: string, result: string[]) => {
    const newUsedLetters = { ...usedLetters };
    guess.toUpperCase().split('').forEach((letter, i) => {
      const currentStatus = newUsedLetters[letter];
      const newStatus = result[i];
      if (currentStatus !== 'correct') {
        newUsedLetters[letter] = newStatus;
      }
    });
    setUsedLetters(newUsedLetters);
  };

  const handleGuess = async () => {
    if (currentGuess.length !== 5) {
      setMessage('Word must be 5 letters long');
      return;
    }

    try {
      const { data } = await axios.post(`${API_URL}/guess`, { guess: currentGuess });

      if (!data.valid) {
        setMessage(data.message);
        return;
      }

      setGuesses([...guesses, currentGuess]);
      setResults([...results, data.result]);
      updateUsedLetters(currentGuess, data.result);
      setCurrentGuess('');

      if (data.isCorrect) {
        setGameWon(true);
        setGameOver(true);
        setCurrentWord(currentGuess);
      } else if (guesses.length === 5) {
        setGameOver(true);
        setCurrentWord(currentGuess); // The server should send the word in the response
      }
    } catch (error) {
      console.error('Error checking guess:', error);
      setMessage('Error checking guess');
    }
  };

  const handleSubmitScore = async (name: string) => {
    try {
      await axios.post(`${API_URL}/score`, {
        name,
        attempts: guesses.length,
        time: Date.now() - startTime
      });
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const handleKey = (key: string) => {
    if (gameOver) return;

    if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
      setMessage('');
    } else if (key === 'Enter') {
      handleGuess();
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key.toLowerCase());
      setMessage('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleKey('Backspace');
      } else if (e.key === 'Enter') {
        handleKey('Enter');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Wordle Clone</h1>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Leaderboard
          </button>
        </div>

        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
            {message}
          </div>
        )}

        <div className="flex justify-center">
          <GameBoard
            guesses={guesses}
            results={results}
            currentGuess={currentGuess}
          />
        </div>

        <div className="mt-8">
          <Keyboard
            onKey={handleKey}
            usedLetters={usedLetters}
          />
        </div>
      </div>

      {gameOver && currentWord && (
        <GameOver
          won={gameWon}
          word={currentWord}
          attempts={guesses.length}
          onPlayAgain={startNewGame}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onSubmitScore={gameWon ? handleSubmitScore : undefined}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          scores={scores}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      <div className="fixed bottom-2 right-2 text-xs text-gray-500">
        Server v{serverVersion}
      </div>
    </div>
  );
}
