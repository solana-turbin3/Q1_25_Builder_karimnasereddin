import OpenAI from 'openai';
import { createStreamDataTransformer, LangChainAdapter, OpenAIStream, StreamingTextResponse } from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { useSagentProgram, useSagentProfile } from '@/components/dashboard/sagent-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'

export const dynamic = 'force-dynamic'

const intentTemplate = `You are a Solana blockchain assistant. Analyze the user's input and classify their intent as either:
- "QUESTION": General inquiries, explanations, or non-transaction requests
- "FUNCTION": Requests that require executing blockchain transactions

Available functions:
- sendSol (send SOL to another wallet)
- sendToken (send SPL tokens)
- createTokenMint (create new token)
- createNftMint (create NFT collection)
- swapTokens (token swaps)
- subscribe (purchase transaction package)
- mintNft (mint NFT from collection)

Examples of FUNCTION intents:
- "Send 2 SOL to Alice"
- "Create a new token called MyToken"
- "Swap 1 SOL for USDC"
- "Mint me an NFT from my collection"

Examples of QUESTION intents:
- "How do I create a token?"
- "Explain what an NFT is"
- "What's the current SOL price?"

User input: {input}



Respond ONLY with either "QUESTION" or "FUNCTION". 
`
;

const FunctionParserTemplate = `Analyze the user's request and identify which blockchain function to execute. 
Available functions with parameters:
1. subscribe - No parameters (automatically uses connected wallet)
   Example: "I want to purchase the transaction package"

2. sendSol(amount: SOL, recipient: address)
   Example: "Send 1.5 SOL to D8VHjq...Q7vEJY"

3. sendToken(amount: number, recipient: address, mint: token-address)
   Example: "Transfer 500 USDC to FkeGHF...h4Gf2d"

4. createTokenMint(name: string, symbol: string, uri: metadata-url)
   Example: "Create a token called MyToken with symbol MT and metadata url https://example.com"

5. createNftMint(name: string, symbol: string, uri: metadata-url)
   Example: "Create an NFT collection named CryptoCats"

6. swapTokens(amountIn: number, inputTokenMint: address, outputTokenMint: address)
   Example: "Swap 1 SOL for 150 USDC"
   SOL ADDRESS: So11111111111111111111111111111111111111112


For the user input: {input}

Respond STRICTLY in this format:
FUNCTION NAME
Example: "SUBSCRIBE" , "SEND SOL : 1.5 : 87oBnRpez5eZ9f5Utza5ZuAwCENio9P4jgPNMA8CpBSr" , "SEND TOKEN : 100 : GnYmtJWEDCYypuYcQSS8MYG4wKVLtW3bMXB4fwNYgUYf : GnYmtJWEDCYypuYcQSS8MYG4wKVLtW3bMXB4fwNYgUYf " , "CREATE TOKEN MINT : MyToken : MT : https://example.com" , "CREATE NFT MINT : MyNFT : MN : https://example.com" , "SWAP TOKENS : 1 : So11111111111111111111111111111111111111112 : GnYmtJWEDCYypuYcQSS8MYG4wKVLtW3bMXB4fwNYgUYf" "

Rules:
1. ONLY if parameters are missing, list them in the response without any other text`

const QuestionTemplate = `You are an expert in the Solana blockchain named Sagent. Answer the user's question in a friendly and engaging manner and consider the user is a beginner/intermediate user.

User input: {input}

AI: Answer
`


export async function POST(req: Request) {
    try{
        const {messages} = await req.json()
        const input=messages[messages.length-1].content

        const OPENAI_API_KEY=process.env.OPENAI_API_KEY!
        const llm =new ChatOpenAI({
            apiKey: OPENAI_API_KEY,
            modelName: 'gpt-4o-mini',
            temperature: 0.3,
        });

        const intentPrompt = PromptTemplate.fromTemplate(intentTemplate);
        const parser= new StringOutputParser();
        const intentChain = intentPrompt.pipe(llm).pipe(parser);
        const intent = await intentChain.invoke({ input });
        const functionPrompt = PromptTemplate.fromTemplate(FunctionParserTemplate);

        switch(intent) {
            case "QUESTION":
                if (input === "Transaction Confirmed!") {
                    return new Response(null, { status: 204 });
                }
                
                const questionPrompt = PromptTemplate.fromTemplate(QuestionTemplate);
                const questionChain = questionPrompt.pipe(llm).pipe(parser);
                const answer = await questionChain.stream({ input });
                return LangChainAdapter.toDataStreamResponse(answer);

            case "FUNCTION":
                const functionChain = functionPrompt.pipe(llm).pipe(parser);
                const functionResponse = await functionChain.stream({ input });
                return LangChainAdapter.toDataStreamResponse(functionResponse);

            default:
                return new Response('Unrecognized intent', { status: 400 });
        }
        
    }catch(e:any){
        return Response.json({error: e.message}, {status: e.status ?? 500})
    }
}



    

// export async function POST(req: Request) {
//     // Extract the `messages` from the body of the request
//     const { messages } = await req.json();

//     // Request the OpenAI API for the response based on the prompt
//     const response = await openai.chat.completions.create({
//         model: 'gpt-4o-mini',
//         stream: true,
//         messages: messages,
//     });

//     // Convert the response into a friendly text-stream
//     const stream = OpenAIStream(response);

//     // Respond with the stream
//     return new StreamingTextResponse(stream);
// }