'use client'

import { useEffect, useState, ReactNode, useRef } from 'react'
import { useChat } from 'ai/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Github } from 'lucide-react'
import Marked, { ReactRenderer } from 'marked-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import { Skeleton } from "@/components/ui/skeleton"
import toast from 'react-hot-toast'
import Logo from '@/assets/Logo.png'
import { CardTopLeftCover, CardTopRightCover } from '@/assets/CardTopCover'
import { CardLeftSideCover, CardRightSideCover } from '@/assets/CardSideCover'
import { CardLeftSideHandles, CardRightSideHandles } from '@/assets/CardSideHandles'
import ShareButton from '@/components/ShareButton'

interface Models {
  name: string
  modelId: string
  description: string
  icon: string
}

const models: Models[] = [
  {
    name: "DeepSeek R1 Distill Llama 70b",
    modelId: 'groq:deepseek-r1-distill-llama-70b',
    description: 'Meta Llama 3.3 70b Model',
    icon: '/groq.svg',
  },
  {
    name: 'DeepSeek R1',
    modelId: 'deepseek:deepseek-reasoner',
    description: 'DeepSeek Reasoning Model',
    icon: '/deepseek.svg',
  },
]

const loadingMessages = [
  "Analyzing digital footprint...",
  "Processing social patterns...",
  "Computing compatibility...",
  "Mapping social connections...",
  "Generating insights...",
  "Finalizing report...",
]

const renderer: Partial<ReactRenderer> = {
  heading: (children: ReactNode, level: number) => (
    <h2 className={`text-${level === 1 ? '2xl' : 'xl'} font-medium !text-zinc-100 my-4`}>
      {children}
    </h2>
  ),
  strong: (children: ReactNode) => (
    <strong className="!text-zinc-100 font-semibold">{children}</strong>
  ),
  paragraph: (children: ReactNode) => (
    <p className="text-zinc-300 mb-4 break-words">{children}</p>
  ),
  list: (children: ReactNode, ordered?: boolean) => (
    <ul className={`list-disc pl-4 mb-4 space-y-2 text-zinc-300 ${ordered ? 'list-decimal' : ''}`}>
      {children}
    </ul>
  ),
  listItem: (children: ReactNode) => (
    <li className="text-zinc-300 break-words">{children}</li>
  ),
  table: (children: ReactNode) => (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-lg border border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-700/50 !m-0">
            {children}
          </table>
        </div>
      </div>
    </div>
  ),
  tableHeader: (children: ReactNode) => (
    <thead className="bg-zinc-800/90 !text-zinc-200">
      {children}
    </thead>
  ),
  tableBody: (children: ReactNode) => (
    <tbody className="divide-y !divide-zinc-700/50">
      {children}
    </tbody>
  ),
  tableRow: (children: ReactNode) => (
    <tr className="transition-colors hover:bg-zinc-700/30">
      {children}
    </tr>
  ),
  tableCell: (children: ReactNode[], flags: { header: boolean }) => (
    flags.header ? (
      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium tracking-wider !text-zinc-200 uppercase">
        {children}
      </th>
    ) : (
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm !text-zinc-200 whitespace-normal break-words">
        {children}
      </td>
    )
  ),
}

export default function Home() {
  const [auraUser, setAuraUser] = useState('')
  const [auraSubject, setAuraSubject] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loadingIdx, setLoadingIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState(models[0].modelId)

  // const [isLoading, setIsLoading] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, setMessages, stop, isLoading } = useChat({
    api: '/api/check-aura',
    body: { auraUser, auraSubject, model: selectedModel }
  })

  const validateUsernames = (user: string, subject: string) => {
    if (user.toLowerCase() === subject.toLowerCase()) {
      toast.error("Comparing yourself to yourself? That's deep... but try someone else!", {
        style: {
          background: '#27272a',
          color: '#fafafa',
          border: '1px solid #3f3f46',
        },
        iconTheme: {
          primary: '#71717a',
          secondary: '#18181b',
        },
      });
      return false;
    }
    return true;
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanUsername = e.target.value.replace('@', '').trim();
    setAuraUser(cleanUsername);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanUsername = e.target.value.replace('@', '').trim();
    setAuraSubject(cleanUsername);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!validateUsernames(auraUser, auraSubject)) return;

    // setIsLoading(true)

    // await new Promise(resolve => setTimeout(resolve, 3000))
    // setIsLoading(false)
    setIsSubmitted(true);
    handleSubmit(e);
  };

  const resetForm = () => {
    stop()
    setAuraUser('')
    setAuraSubject('')
    setIsSubmitted(false)
    setMessages([])
    setLoadingIdx(0)
  }

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingIdx((prev) => (prev + 1) % loadingMessages.length)
      }, 2000)
      return () => clearInterval(interval)
    }
    setLoadingIdx(0)
  }, [isLoading])

  const assistantMessages = messages.filter((m) => m.role === 'assistant')
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
  const streamingReasoning = lastAssistantMessage?.reasoning || ""
  const result = lastAssistantMessage?.content || ""
  const reasoning = streamingReasoning

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, result])

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-20 text-sm md:text-[15px]">

      <div className='fixed top-4 right-4'>
        <ShareButton />
      </div>

      <div className='w-full flex flex-col items-center relative z-10'>
        <div className='relative w-full md:max-w-[800px]'>
          <div className="bg-[#1F2433] backdrop-blur-sm border-[5px] border-[#293040] p-3 pt-2 rounded-[32px] relative overflow-hidden">


            <motion.div
              animate={{ height: isLoading ? '260px' : '162px' }}
              className='absolute top-0 left-0 w-full flex overflow-visible justify-between'
            >
              <CardTopLeftCover
                preserveAspectRatio='none'
                className={`relative scale-[65%] h-full md:scale-100 origin-top-left shrink-0 ${!isSubmitted ? 'left-0' : '-left-[300px]'} duration-500`}
              />
              <CardTopRightCover
                preserveAspectRatio='none'
                className={`relative h-full scale-[65%] md:scale-100 origin-top-right ${!isSubmitted ? 'right-0' : '-right-[300px]'} duration-500`}
              />
            </motion.div>

            {!isLoading && isSubmitted && (
              <div className='absolute top-0 left-0 w-full flex justify-between h-full overflow-visible'>
                <motion.div
                  initial={{ x: "-200px" }}
                  animate={{ x: "-40px" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                >
                  <CardLeftSideCover className="h-full w-[62px] md:w-auto relative rotate-180" />
                </motion.div>
                <motion.div
                  initial={{ x: "200px" }}
                  animate={{ x: "40px" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                >
                  <CardRightSideCover className="h-full w-[62px] md:w-auto relative rotate-180" />
                </motion.div>
              </div>
            )}

            {/* header */}
            <div className='w-full flex flex-col gap-6 items-center my-6'>
              <Image
                src={Logo}
                alt='Aura Logo'
                width={200}
                height={200}
                className='w-20 h-auto'
              />

              <div className='flex flex-col gap-1 items-center'>
                <h1 className='text-2xl font-light'>Aura Checker</h1>
                <p className='opacity-70 font-light'>Compare your Aura with Twitter posts</p>
              </div>

              {/*  */}
              {isSubmitted && (
                <div className='flex flex-col md:flex-row p-4 w-full gap-8 mt-4 max-w-[600px]'>
                  <div className='flex flex-col items-center p-4 bg-[#2E3547] rounded-2xl w-full gap-3'>
                    <p className='text-4xl font-medium'>75</p>
                    <div className='flex flex-col items-center gap-1'>
                      <p className='text-sm text-[#B1B6C0] opacity-60'>Aura points</p>
                      <p className='opacity-60'>@{auraUser}</p>
                    </div>
                  </div>

                  <div className='flex flex-col items-center p-4 bg-[#2E3547] rounded-2xl w-full gap-3' style={{ background: 'linear-gradient(90deg, #939BFF 0%, #5966FE 100%)' }}>
                    <p className='text-4xl font-medium'>90</p>
                    <div className='flex flex-col items-center gap-1'>
                      <p className='text-sm opacity-70'>Aura points</p>
                      <p>@{auraSubject}</p>
                    </div>
                  </div>
                </div>
              )}


            </div>

            {/* form */}
            {!isLoading && !isSubmitted && (
              <form
                className='flex flex-col gap-2 pt-5'
              >
                <div className="relative flex gap-0 items-center w-full bg-[#2E3547] rounded-xl px-3 h-12">
                  <span className="shrink-0">Your:</span>
                  <Input
                    placeholder="@username"
                    value={auraUser}
                    onChange={handleUserChange}
                    className="border-none placeholder:text-[#8B929F] focus-visible:ring-0 px-2"
                    aria-label="Your X(Twitter) username"
                  />
                  <span className="absolute right-4 text-[#B1B6C0] opacity-70 text-xs font-medium">{`(X/Twitter)`}</span>
                </div>

                <div className="relative flex gap-0 items-center w-full bg-[#2E3547] rounded-xl px-3 h-12">
                  <span className="shrink-0">Their:</span>
                  <Input
                    placeholder="@username"
                    value={auraSubject}
                    onChange={handleSubjectChange}
                    className="border-none placeholder:text-[#8B929F] focus-visible:ring-0 px-2"
                    aria-label="Their X(Twitter) username"
                  />
                  <span className="absolute right-4 text-[#B1B6C0] opacity-70 text-xs font-medium">{`(X/Twitter)`}</span>
                </div>

                <div className="relative flex gap-0 w-full bg-[#2E3547] rounded-xl p-3">
                  <Textarea
                    placeholder="Describe anything you may have in common..."
                    value={input}
                    onChange={handleInputChange}
                    className="border-none placeholder:text-[#8B929F] focus-visible:ring-0 p-0 min-h-20 resize-none"
                    aria-label="Describe your situation"
                  ></Textarea>
                </div>

              </form>
            )}

          </div>

          {!isLoading && isSubmitted && (
            <div className='w-full flex items-center justify-between absolute top-0 left-0 -z-10'>
              <motion.div
                initial={{ x: "-20px", opacity: 0 }}
                animate={{ x: "-76px", opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.5 }}
              >
                <CardLeftSideHandles />
              </motion.div>
              <motion.div
                initial={{ x: "20px", opacity: 0 }}
                animate={{ x: "76px", opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.5 }}
              >
                <CardRightSideHandles />
              </motion.div>
            </div>
          )}
        </div>


        {!isLoading && !isSubmitted && (
          <button
            onClick={onSubmit}
            style={{ background: 'linear-gradient(90deg, #939BFF 0%, #5966FE 100%)' }} className='max-w-[800px] mt-3 w-full h-12 rounded-xl text-white'
          >
            Generate Aura Report ++
          </button>
        )}

        {(isSubmitted && !result) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='w-full py-10 p-4 flex flex-col gap-3 items-center'
          >
            <p className='opacity-60'>Generating Report...</p>
            <div className='relative w-full md:max-w-[600px] mx-auto h-3 rounded-full bg-white/10'>
              <motion.div
                className='h-full rounded-full' style={{ background: 'linear-gradient(90deg, #939BFF 0%, #5966FE 100%)' }}
                initial={{ width: '0%' }}
                animate={{ width: '90%' }}
                exit={{ width: '100%' }}
                transition={{ duration: isLoading ? 3 : 0.3 }}
              />
            </div>

          </motion.div>
        )}

        {result && (
          <div className='relative pt-14'>

            {/* result header */}
            <div className='flex flex-col gap-4 items-center'>
              <h2 className='text-2xl md:text-3xl font-medium md:font-light'>Aura Compatibility Report</h2>
              <div className='flex items-center gap-4'>
                <div className='h-8 rounded-full border border-white/15 px-4 inline-flex items-center gap-2 text-sm text-white/70'>
                  @{auraUser}
                </div>
                <span className='text-white/50'>x</span>
                <div className='h-8 rounded-full border border-white/15 px-4 inline-flex items-center gap-2 text-sm text-white/70'>
                  @{auraSubject}
                </div>
              </div>
            </div>

            {/* result body */}
            <div className='mt-10 max-w-[900px] text-white/70 tracking-wider font-light leading-5 p-2'>
              {reasoning && (
                <Accordion
                  collapsible
                  type="single"
                  defaultValue="reasoning"
                  className="mb-8 max-w-full sm:max-w-2xl"
                >
                  <AccordionItem
                    value="reasoning"
                    className="border-none rounded-lg bg-zinc-800/40 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-medium !text-zinc-100 hover:bg-zinc-800/40 rounded-lg transition-all hover:no-underline">
                      AI Reasoning Process
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1 max-w-full sm:max-w-2xl">
                      <div className="prose prose-sm sm:prose prose-invert prose-zinc w-full break-words">
                        <Marked value={reasoning} renderer={renderer} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              {result && (
                <div className="prose prose-sm sm:prose prose-invert prose-zinc max-w-full sm:max-w-2xl px-2 break-words">
                  <Marked value={result} renderer={renderer} />
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  )
}