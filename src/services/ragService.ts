import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import type { Document } from "@langchain/core/documents";
import { llm, embeddings } from "../config/gemini.js";
import type { ChatMessagePayload } from "../types/chat.js";

const knowledgeDocs: string[] = [
  "NovaPulse is a lightweight wearable monitor measuring micro-vibrations in muscles.",
  "NovaPulse battery lasts up to 14 days on a single charge and uses USB-C fast charging.",
  "The standard warranty covers manufacturing defects for 24 months from purchase.",
];

let retriever: VectorStoreRetriever<MemoryVectorStore>;
let ragChain: RunnableSequence<{ question: string; chat_history: BaseMessage[] }, string>;

export const initRagService = async (): Promise<void> => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
  });

  const docs = await splitter.createDocuments(knowledgeDocs);
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  retriever = vectorStore.asRetriever({ k: 2 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful assistant. Use only the provided context to answer questions.\n\nContext:\n{context}",
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  ragChain = RunnablePassthrough.assign<{ question: string; chat_history: BaseMessage[] }, { context: string }>({
    context: async (input: { question: string }) => {
      const matchedDocs: Document[] = await retriever.invoke(input.question);
      return matchedDocs.map((doc) => doc.pageContent).join("\n\n");
    },
  })
    .pipe(prompt)
    .pipe(llm)
    .pipe(new StringOutputParser());
};

export const runRagQuery = async (
  question: string,
  chatHistory: ChatMessagePayload[] = []
): Promise<string> => {
  if (!ragChain) {
    throw new Error("RAG service has not been initialized yet.");
  }

  const formattedHistory: BaseMessage[] = chatHistory.map((item) =>
    item.role === "user"
      ? new HumanMessage(item.content)
      : new AIMessage(item.content)
  );

  return await ragChain.invoke({
    question,
    chat_history: formattedHistory,
  });
};