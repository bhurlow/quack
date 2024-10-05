"use client";

import { useState, useEffect } from "react";
import Head from "next/head";

export default function LandingPage() {
  const [audioFiles, setAudioFiles] = useState<HTMLAudioElement[]>([]);
  const [isQuacking, setIsQuacking] = useState(false);

  useEffect(() => {
    setAudioFiles([
      new Audio("/quack1.wav"),
      new Audio("/quack2.wav"),
      new Audio("/quack3.wav"),
    ]);
  }, []);

  const playRandomQuack = () => {
    if (audioFiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      const selectedAudio = audioFiles[randomIndex];
      selectedAudio.currentTime = 0;
      selectedAudio.play();
      setIsQuacking(true);
      setTimeout(() => setIsQuacking(false), 300);
    }
  };

  return (
    <>
      <Head>
        <title>
          Quack - Advanced Data Analytics Platform | CSV, Excel, AI-Powered
          Insights
        </title>
        <meta
          name="description"
          content="Quack is an innovative data analytics platform that transforms CSV and Excel data using AI. Powerful tools for data visualization and analysis."
        />
        <meta
          name="keywords"
          content="data analytics, CSV analysis, Excel data, AI analytics, data visualization, business intelligence, data platform"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          property="og:title"
          content="Quack - Advanced Data Analytics Platform"
        />
        <meta
          property="og:description"
          content="Transform your CSV and Excel data with AI-powered analytics and visualization tools."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quack-analytics.com" />{" "}
        {/* Replace with your actual URL */}
        <meta
          property="og:image"
          content="https://quack-analytics.com/og-image.jpg"
        />{" "}
        {/* Replace with your actual image URL */}
        <link rel="canonical" href="https://quack-analytics.com" />{" "}
        {/* Replace with your actual URL */}
      </Head>
      <div className="min-h-screen bg-black text-white font-sans">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
          <main className="py-16 sm:py-24 space-y-16">
            <section>
              <div className="flex items-center mb-6">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mr-4">
                  <a href="/app">Quack</a>
                </h1>
                <button
                  onClick={playRandomQuack}
                  className={`text-4xl sm:text-5xl lg:text-6xl bg-transparent border-none cursor-pointer hover:opacity-80 transition-all duration-300 ${
                    isQuacking ? "transform scale-125 rotate-6" : ""
                  }`}
                  aria-label="Play random quack sound"
                >
                  🦆
                </button>
              </div>
              <p className="text-base sm:text-lg text-gray-100">
                Quack is an interactive data tool that allows you to ask
                questions about your data. Load in a data file (CSV, JSON) and
                ask away.
              </p>
              <p className="my-4 text-base sm:text-lg text-gray-100">
                Try it out{" "}
                <a
                  href="/app"
                  className="font-bold text-blue-400 hover:underline"
                >
                  here
                </a>
                .
              </p>
              <p className="my-4 text-base sm:text-lg text-gray-100">
                Quack loads your data into an instance of{" "}
                <a
                  href="https://duckdb.org"
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DuckDB
                </a>{" "}
                running in the browser using
                <a
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://webassembly.org/"
                >
                  {" "}
                  Web Assembly.
                </a>{" "}
                Text is converted to SQL using AI{" "}
                <a
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.anthropic.com/claude"
                >
                  (Claude 3.5)
                </a>
              </p>
              <hr className="my-4" />
              <p>
                Made by{" "}
                <a
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://brianhurlow.com"
                >
                  Brian Hurlow
                </a>
              </p>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
