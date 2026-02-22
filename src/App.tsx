import './App.css';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Header, Keyboard, Puzzles, EndScreen } from './components';
import { checkValidity } from './util/checkValidity';
import { generateWordlist } from './util/generateWordlist';
import { sortByValue } from './util/sortByValue';

const STORAGE_KEY = 'wordgame-save';

const Container = styled.div`
  display: flex;
  justify-content: center;
  background-color: #f7f8f9;
`;

const Content = styled.div`
  max-width: 600px;
  box-shadow: 4px 4px 40px 4px rgba(0, 0, 0, 0.2);
  background-color: #fff;
  margin-bottom: 200px;
`;

function App() {
  const totalWords = 1000;
  const maxGuesses = 1005;

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        wordlist: generateWordlist(totalWords),
        guesslist: [],
        progressHistory: [],
        working: ''
      };
    }
    return JSON.parse(saved);
  }

  const initial = loadState();

  const [wordlist, setWordlist] = useState<string[]>(initial.wordlist);
  const [guesslist, setGuesslist] = useState<string[]>(initial.guesslist);
  const [progressHistory, setProgressHistory] = useState<number[]>(initial.progressHistory);
  const [working, setWorking] = useState<string>(initial.working);

  const expired = guesslist.length >= maxGuesses;

  function saveState(
    w = wordlist,
    g = guesslist,
    p = progressHistory,
    wk = working
  ) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        wordlist: w,
        guesslist: g,
        progressHistory: p,
        working: wk
      })
    );
  }

  function addKey(key: string) {
    if (key === '-' || key === 'Backspace') {
      setWorking((tmp) => tmp.slice(0, -1));
      return;
    }

    if (
      (key === '+' || key === 'Enter') &&
      working.length === 5 &&
      checkValidity(working)
    ) {
      const newGuesslist = [...guesslist, working];
      const newWordlist = sortByValue(wordlist, newGuesslist);
      const newProgress = [
        ...progressHistory,
        totalWords - (newWordlist.length - 1)
      ];

      setGuesslist(newGuesslist);
      setWordlist(newWordlist);
      setProgressHistory(newProgress);
      setWorking('');

      saveState(newWordlist, newGuesslist, newProgress, '');
      return;
    }

    if (working.length < 5 && key.length === 1 && key !== ' ') {
      setWorking((tmp) => tmp + key.toLowerCase());
    }
  }

  useEffect(() => {
    function keyEvent(ev: KeyboardEvent) {
      addKey(ev.key);
    }

    if (!expired) {
      window.addEventListener('keydown', keyEvent);
      return () => window.removeEventListener('keydown', keyEvent);
    }
  }, [working, expired]);

  useEffect(() => {
    saveState();
  }, [wordlist, guesslist, progressHistory, working]);

  function getUsedLetters() {
    const letters: string[] = [];

    guesslist.forEach((word) => {
      for (const char of word) {
        if (!letters.includes(char)) letters.push(char);
      }
    });

    return letters;
  }

  return (
    <div className="App">
      <Container>
        <Content>
          <Header
            guesses={guesslist.length}
            limit={maxGuesses}
            remaining={wordlist.length}
          />

          <Puzzles
            expired={expired}
            guesslist={guesslist}
            wordlist={wordlist}
            working={working}
          />

          {wordlist.length === 0 && (
            <EndScreen progressHistory={progressHistory} />
          )}

          <Keyboard
            expired={expired}
            onKeyPress={(key) => addKey(key)}
            usedLetters={getUsedLetters()}
          />
        </Content>
      </Container>
    </div>
  );
}

export default App;
