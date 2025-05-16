import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useSpeechRecognition } from "react-speech-recognition";
import SpeechRecognition from "react-speech-recognition";
import {
  FaMicrophone,
  FaStop,
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaSun,
  FaMoon,
  FaRunning,
  FaHeartbeat,
  FaAppleAlt,
  FaRegClock,
  FaThumbsUp,
  FaLink
} from "react-icons/fa";

const ChatBot = () => {
  // State management
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! 👋 I'm HealthBot, your personal health assistant. Ask me anything about nutrition, fitness, or general wellness!",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [reactions, setReactions] = useState({});
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // Speech recognition
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const quickReplies = [
    { icon: <FaRunning className="text-blue-500" />, text: "Best exercises for weight loss?" },
    { icon: <FaHeartbeat className="text-blue-500" />, text: "How much protein should I eat daily?" },
    { icon: <FaRegClock className="text-blue-500" />, text: "30-minute home workout routine?" },
    { icon: <FaAppleAlt className="text-blue-500" />, text: "Best foods for post-workout recovery?" },
  ];

  // Format message content with proper styling
  const formatMessageContent = (content) => {
    if (!content) return "";
    
    // Handle bullet points
    let formattedContent = content.replace(/•\s?(.*?)(?=(\n•|\n\n|$))/gs, '<li>$1</li>');
    
    // Handle numbered lists (1. 2. 3.)
    formattedContent = formattedContent.replace(/(\d+)\.\s?(.*?)(?=(\n\d+\.|\n\n|$))/gs, '<li>$1. $2</li>');
    
    // Wrap bullet and numbered lists in ul/ol
    if (formattedContent.includes('<li>')) {
      // Check if it contains numbered list
      if (formattedContent.match(/\d+\.\s/)) {
        formattedContent = formattedContent.replace(/(<li>\d+\..*?<\/li>)+/gs, '<ol class="list-decimal ml-5 my-3">$&</ol>');
      } else {
        formattedContent = formattedContent.replace(/(<li>.*?<\/li>)+/gs, '<ul class="list-disc ml-5 my-3">$&</ul>');
      }
    }
    
    // Handle bold text (wrap with **)
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italics (wrap with *)
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle links [text](url)
    formattedContent = formattedContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-500 hover:text-blue-700">$1</a>');
    
    // Handle headers
    formattedContent = formattedContent.replace(/#{3}\s?(.*?)(?=\n|$)/g, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>');
    formattedContent = formattedContent.replace(/#{2}\s?(.*?)(?=\n|$)/g, '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>');
    formattedContent = formattedContent.replace(/#{1}\s?(.*?)(?=\n|$)/g, '<h1 class="text-2xl font-bold mt-3 mb-2">$1</h1>');
    
    // Handle paragraphs - wrap content separated by double newlines
    formattedContent = formattedContent.replace(/([^\n]+)(\n\n|$)/g, '<p class="mb-3">$1</p>');
    
    // Fix duplicated paragraph tags
    formattedContent = formattedContent.replace(/<p><(h[1-3]|ul|ol|li)>/g, '<$1>');
    formattedContent = formattedContent.replace(/<\/(h[1-3]|ul|ol|li)><\/p>/g, '</$1>');
    
    return formattedContent;
  };

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    
    // Add dark mode class to document if needed
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Core functions
  const handleSend = async () => {
    if (!input.trim() && !file) return;

    // Hide quick replies once user sends first message
    setShowQuickReplies(false);

    // Construct user message
    const userMessage = {
      sender: "user",
      text: input,
      file: file ? URL.createObjectURL(file) : null,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setFile(null);
    resetTranscript();
    setIsTyping(true);

    try {
      // Optional: simulate delay for realism
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await axios.post("http://localhost:8000/api/chat", {
        message: input,
      });

      const responseText = response.data.response;

      const newMessages = [];

      // Check for error-like phrases
      const isError = responseText.toLowerCase().includes("trouble") || 
                     responseText.toLowerCase().includes("unavailable");

      // Bot main response
      newMessages.push({
        sender: "bot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // If no error and videos are available, show video suggestions
      if (!isError && response.data.videos?.length > 0) {
        newMessages.push({
          sender: "bot",
          text: "Here are some helpful video resources:",
          videos: response.data.videos,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Oops! I'm having trouble connecting. Please try again later.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
      // Focus on input field after sending
      inputRef.current?.focus();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      if (transcript) {
        setInput(transcript);
        setTimeout(() => handleSend(), 100);
      }
    } else {
      resetTranscript();
      setIsListening(true);
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    
    // Toggle dark mode class on document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleReaction = (messageIndex, emoji) => {
    setReactions((prev) => {
      const newReactions = { ...prev };
      // Toggle reaction
      if (newReactions[messageIndex] === emoji) {
        delete newReactions[messageIndex];
      } else {
        newReactions[messageIndex] = emoji;
      }
      return newReactions;
    });
  };

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${darkMode ? 'from-gray-900 to-gray-800' : 'from-blue-50 to-indigo-100'} transition-colors duration-300`}>
      <div className="flex flex-col w-full max-w-4xl h-5/6 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
              <FaHeartbeat className="text-lg" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">HealthBot</h2>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="flex flex-col space-y-6">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-3/4 space-x-3 ${msg.sender === 'user' ? 'space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${msg.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'bot' ? 'bg-blue-500' : 'bg-indigo-500'} text-white`}>
                      {msg.sender === 'bot' ? (
                        <FaHeartbeat className="text-sm" />
                      ) : (
                        <span className="text-xs font-medium">You</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex flex-col space-y-1 max-w-md">
                    <div 
                      className={`px-4 py-3 rounded-2xl ${
                        msg.sender === 'bot' 
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-700 rounded-tl-none' 
                          : 'bg-blue-500 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.text && (
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ 
                            __html: msg.sender === "bot" 
                              ? formatMessageContent(msg.text) 
                              : msg.text 
                          }}
                        />
                      )}
                      
                      {msg.file && (
                        <div className="mt-2 rounded-md overflow-hidden">
                          <img src={msg.file} alt="Uploaded content" className="max-w-full" />
                        </div>
                      )}
                      
                      {msg.videos && msg.videos.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.videos.map((video, idx) => (
                            <a 
                              key={idx} 
                              href={video} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-300 text-sm hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                              <FaLink className="flex-shrink-0" />
                              <span>Exercise Video #{idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{msg.timestamp}</span>
                      
                      {msg.sender === "bot" && (
                        <button
                          onClick={() => handleReaction(i, "👍")}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                            reactions[i] === "👍" ? "text-blue-500" : "text-gray-400"
                          }`}
                          aria-label="Thumbs up"
                        >
                          <FaThumbsUp className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="flex space-x-3 max-w-md">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                      <FaHeartbeat className="text-sm" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 max-w-md">
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-tl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {showQuickReplies && messages.length === 1 && (
              <div className="flex flex-col items-center w-full mt-4 mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Try asking about:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(reply.text);
                        setTimeout(() => handleSend(), 0);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                    >
                      <div className="flex-shrink-0">{reply.icon}</div>
                      <span className="text-gray-700 dark:text-gray-200 text-sm">{reply.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-end space-x-2">
            {/* File Upload */}
            <div className="relative">
              <label htmlFor="file-input" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer transition-colors duration-200">
                <FaPaperclip className="text-lg" />
              </label>
              <input
                id="file-input"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Input Field Container */}
            <div className="flex-1 relative flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 min-h-12">
              {file && (
                <div className="absolute -top-10 left-0 flex items-center space-x-2 bg-white dark:bg-gray-800 py-1 px-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{file.name}</span>
                  <button 
                    onClick={() => setFile(null)} 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              )}

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message HealthBot..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-700 dark:text-white resize-none max-h-32 py-2 text-sm"
                rows="1"
              />
            </div>

            {/* Voice Input */}
            {browserSupportsSpeechRecognition && (
              <button
                onClick={toggleMic}
                className={`flex items-center justify-center w-10 h-10 rounded-full focus:outline-none transition-colors duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={isListening ? "Stop recording" : "Start recording"}
              >
                {isListening ? <FaStop className="text-lg" /> : <FaMicrophone className="text-lg" />}
              </button>
            )}

            {/* Send Button */}
            <button 
              onClick={handleSend} 
              disabled={!input.trim() && !file}
              className={`flex items-center justify-center w-10 h-10 rounded-full focus:outline-none transition-colors duration-200 ${
                !input.trim() && !file 
                  ? 'bg-blue-300 dark:bg-blue-900 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FaPaperPlane className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;