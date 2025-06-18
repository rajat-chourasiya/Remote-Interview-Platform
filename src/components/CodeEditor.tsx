import { CODING_QUESTIONS, LANGUAGES } from "@/constants";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircleIcon, BookIcon, LightbulbIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUserRole } from "../hooks/useUserRole";

function CodeEditor() {
  const [selectedQuestion, setSelectedQuestion] = useState(CODING_QUESTIONS[0]);
  const [language, setLanguage] = useState<"javascript" | "python" | "java">(LANGUAGES[0].id);
  const [code, setCode] = useState(selectedQuestion.starterCode[language]);
  const socketRef = useRef<Socket | null>(null);
  const { isInterviewer, isCandidate, isLoading } = useUserRole();
  const [countdown, setCountdown] = useState<number | null>(null);

  if (isLoading) return <div>Loading...</div>;

  const handleQuestionChange = (questionId: string) => {
    const question = CODING_QUESTIONS.find((q) => q.id === questionId)!;
    setSelectedQuestion(question);
    setCode(question.starterCode[language]);
    socketRef.current?.emit("question-change", questionId);


  };

  const handleLanguageChange = (newLanguage: "javascript" | "python" | "java") => {
    setLanguage(newLanguage);
    setCode(selectedQuestion.starterCode[newLanguage]);
    socketRef.current?.emit("language-change", newLanguage);


  };

  const startCountdown = (seconds: number) => {
    if (isInterviewer) {
      setCountdown(seconds);
      socketRef.current?.emit("start-timer", seconds);
    }
  };

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("code-update", (incomingCode: string) => {
      console.log("Received code:", incomingCode);
      setCode(incomingCode);
    });

    socket.on("language-change", (newLanguage: "javascript" | "python" | "java") => {
       console.log("Received code:", newLanguage);
      setLanguage(newLanguage);
      const question = CODING_QUESTIONS.find((q) => q.id === selectedQuestion.id);
      setCode(question?.starterCode[newLanguage] || "");
    });

    socket.on("question-change", (questionId: string) => {
      const question = CODING_QUESTIONS.find((q) => q.id === questionId);
      console.log("Received code:", question);
      if (question) {
        setSelectedQuestion(question);
        setCode(question.starterCode[language] || "");
      }
    });
    socket.on("custom-question", (updatedQuestion) => {
      console.log("Received custom question:", updatedQuestion);
      setSelectedQuestion(updatedQuestion);
      setCode(updatedQuestion.starterCode[language] || "");
    });


    socket.on("start-timer", (seconds: number) => {
      setCountdown(seconds);
    });


    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("code-update");
      socket.off("language-change");
      socket.off("question-change");
      socket.off("custom-question");
      socket.off("start-timer");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);


  const handleCodeChange = (value: string | undefined) => {
    const updatedCode = value || "";
    setCode(updatedCode);
    socketRef.current?.emit("code-change", updatedCode);
  };

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[calc-100vh-4rem-1px]">
      {/* QUESTION SECTION */}
      <ResizablePanel>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {selectedQuestion.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your language and solve the problem
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  
                  {isInterviewer && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startCountdown(300)} className="border-l-gray-300 bg-green-600 text-white border px-3 py-[7px] hover:bg-green-700 hover:text-white text-[15px] rounded-md">
                        Start 5-min Timer
                      </button>
                    </div>
                  )}
                  <Select value={selectedQuestion.id} onValueChange={handleQuestionChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODING_QUESTIONS.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>



                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      {/* SELECT VALUE */}
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <img
                            src={`/${language}.png`}
                            alt={language}
                            className="w-5 h-5 object-contain"
                          />
                          {LANGUAGES.find((l) => l.id === language)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    {/* SELECT CONTENT */}
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={`/${lang.id}.png`}
                              alt={lang.name}
                              className="w-5 h-5 object-contain"
                            />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PROBLEM DESC. */}
              <Card>
                {countdown !== null && countdown > 0 && (
                  <div className="text-lg font-semibold text-center pt-1 pb-0 text-red-600">
                    ⏱️ Time left: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                  </div>
                )}
                <CardHeader className="flex flex-row pt-2 items-center gap-2">

                  <BookIcon className="h-5 w-5 text-primary/80" />

                  <CardTitle>Problem Description</CardTitle>

                </CardHeader>

                <CardContent className="text-sm leading-relaxed">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {selectedQuestion.id === "new_question" && isInterviewer ? (
                      <textarea
                        value={selectedQuestion.description}
                        onChange={(e) => {
                          const updatedQuestion = {
                            ...selectedQuestion,
                            description: e.target.value,
                          };
                          setSelectedQuestion(updatedQuestion);
                          socketRef.current?.emit("custom-question", updatedQuestion);
                        }}
                        className="w-full min-h-[120px] text-sm leading-relaxed bg-background text-foreground border rounded-md p-2"
                      />
                    ) : (
                      <p className="pt-1 whitespace-pre-line">{selectedQuestion.description}</p>
                    )}

                  </div>
                </CardContent>
              </Card>

              {/* PROBLEM EXAMPLES */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <LightbulbIcon className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full w-full rounded-md border">
                    <div className="p-4 space-y-4">
                      {selectedQuestion.examples.map((example, index) => (
                        <div key={index} className="space-y-2">
                          <p className="font-medium text-sm">Example {index + 1}:</p>
                          {selectedQuestion.id === "new_question" && isInterviewer ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={example.input}
                                placeholder="Input"
                                onChange={(e) => {
                                  const updatedExamples = [...selectedQuestion.examples];
                                  updatedExamples[index].input = e.target.value;
                                  const updatedQuestion = { ...selectedQuestion, examples: updatedExamples };
                                  setSelectedQuestion(updatedQuestion);
                                  socketRef.current?.emit("custom-question", updatedQuestion);
                                }}
                                className="w-full px-3 py-2 rounded-md border text-sm font-mono"
                              />
                              <input
                                type="text"
                                value={example.output}
                                placeholder="Output"
                                onChange={(e) => {
                                  const updatedExamples = [...selectedQuestion.examples];
                                  updatedExamples[index].output = e.target.value;
                                  const updatedQuestion = { ...selectedQuestion, examples: updatedExamples };
                                  setSelectedQuestion(updatedQuestion);
                                  socketRef.current?.emit("custom-question", updatedQuestion);
                                }}
                                className="w-full px-3 py-2 rounded-md border text-sm font-mono"
                              />
                              <textarea
                                value={example.explanation || ""}
                                placeholder="Explanation"
                                onChange={(e) => {
                                  const updatedExamples = [...selectedQuestion.examples];
                                  updatedExamples[index].explanation = e.target.value;
                                  const updatedQuestion = { ...selectedQuestion, examples: updatedExamples };
                                  setSelectedQuestion(updatedQuestion);
                                  socketRef.current?.emit("custom-question", updatedQuestion);
                                }}
                                className="w-full px-3 py-2 rounded-md border text-sm font-mono"
                              />
                            </div>
                          ) : (
                            <ScrollArea className="h-full w-full rounded-md">
                              <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                                <div>Input: {example.input}</div>
                                <div>Output: {example.output}</div>
                                {example.explanation && (
                                  <div className="pt-2 text-muted-foreground">
                                    Explanation: {example.explanation}
                                  </div>
                                )}
                              </pre>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          )}
                        </div>
                      ))}

                    </div>
                    <ScrollBar />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* CONSTRAINTS */}
              {selectedQuestion.constraints && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <AlertCircleIcon className="h-5 w-5 text-blue-500" />
                    <CardTitle>Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                      {selectedQuestion.constraints.map((constraint, index) => (
                        <li key={index} className="text-muted-foreground">
                          {constraint}
                        </li>
                      ))}
                    </ul>



                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <ScrollBar />
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* CODE EDITOR */}
      <ResizablePanel defaultSize={60} maxSize={100}>
        <div className="h-full relative">
          <Editor
            height={"100%"}
            key={language}
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => {
              const newCode = value || "";
              setCode(newCode);
              socketRef.current?.emit("code-change", newCode);
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 18,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              wordWrap: "on",
              wrappingIndent: "indent",
            }}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
export default CodeEditor;
