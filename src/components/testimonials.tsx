'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

type Testimonial = {
    name: string
    role: string
    image: string
    quote: string
}

const testimonials: Testimonial[] = [
    {
        name: 'Elena Rodriguez',
        role: 'Product Designer',
        image: 'https://randomuser.me/api/portraits/women/1.jpg',
        quote: 'Ibhaveda transformed how I collaborate on design concepts. The feedback I received on my app idea led to a successful funding round!',
    },
    {
        name: 'Marcus Chen',
        role: 'Entrepreneur & Innovator',
        image: 'https://randomuser.me/api/portraits/men/6.jpg',
        quote: 'Found my perfect co-founder through Ibhaveda! We went from initial concept to prototype in just 6 months.',
    },
    {
        name: 'Priya Sharma',
        role: 'Technology Startup Founder',
        image: 'https://randomuser.me/api/portraits/women/7.jpg',
        quote: 'The community validation on Ibhaveda gave me the confidence to quit my job and build my startup full-time.',
    },
    {
        name: 'Alex Thompson',
        role: 'Creative Director',
        image: 'https://randomuser.me/api/portraits/men/8.jpg',
        quote: 'I discovered countless brilliant ideas on this platform. Now I contribute insights that have helped shape 12+ successful projects.',
    },
    {
        name: 'Sarah Kim',
        role: 'UX Researcher',
        image: 'https://randomuser.me/api/portraits/women/4.jpg',
        quote: "Ibhaveda creates a safe space for innovation. Every idea gets proper analysis and constructive feedback from industry experts.",
    },
    {
        name: 'David Morales',
        role: 'Serial Entrepreneur',
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        quote: 'From concept to launch, I collaborated with 15 different creators on Ibhaveda. Together we built something amazing!',
    },
]

export default function WallOfLoveSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
            
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
                    >
                        Trusted by Innovators Worldwide
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-6 text-lg leading-8 text-muted-foreground"
                    >
                        Join thousands of creators who have found collaboration partners, funding opportunities, and inspiration through our platform.
                    </motion.p>
                </div>

                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
                                <div className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors">
                                    <Quote className="w-12 h-12" />
                                </div>
                                <CardContent className="p-8 flex flex-col h-full">
                                    <div className="flex items-center gap-x-4 mb-6">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                            <AvatarImage src={testimonial.image} alt={testimonial.name} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold text-foreground">{testimonial.name}</div>
                                            <div className="text-sm leading-6 text-muted-foreground">{testimonial.role}</div>
                                        </div>
                                    </div>
                                    <blockquote className="flex-1 text-muted-foreground relative z-10">
                                        "{testimonial.quote}"
                                    </blockquote>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
