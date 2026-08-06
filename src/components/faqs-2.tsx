'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQsTwo() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'How does idea sharing work?',
            answer: 'Simply create an account, describe your idea with as much detail as you like, and publish it to the community. You can categorize your idea by topic, add images, and allow community members to provide feedback and suggestions.',
        },
        {
            id: 'item-2',
            question: 'Can I collaborate with others on ideas?',
            answer: 'Absolutely! You can invite collaborators to help develop your ideas through private discussions, shared documents, and project milestones. Our collaboration tools make teaming up with like-minded creators easy and efficient.',
        },
        {
            id: 'item-3',
            question: 'Is my intellectual property protected?',
            answer: 'Yes, we take IP protection seriously. Ideas you mark as proprietary are protected by our community guidelines and terms of service. We recommend consulting legal professionals for important intellectual property matters.',
        },
        {
            id: 'item-4',
            question: 'How can I discover new ideas to explore?',
            answer: 'Browse our comprehensive idea categories, follow creators in your areas of interest, and participate in trending discussions. Our smart recommendations system also suggests ideas based on your preferences and interaction history.',
        },
        {
            id: 'item-5',
            question: 'Can I monetize ideas shared on the platform?',
            answer: 'While we focus on idea creation and collaboration, many creators have successfully launched funded projects, found investors, or converted ideas into businesses. We encourage responsible commercialization and fair attribution.',
        },
    ]

    return (
        <section className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground mt-4 text-balance">Discover quick and comprehensive answers to common questions about our platform, services, and features.</p>
                </div>

                <div className="mx-auto mt-12 max-w-xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="bg-card ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0">
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border-dashed">
                                <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-base">{item.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <p className="text-muted-foreground mt-6 px-8">
                        Can&#39;t find what you&#39;re looking for? Contact our{' '}
                        <Link
                            href="#"
                            className="text-primary font-medium hover:underline">
                            customer support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
