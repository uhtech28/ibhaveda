import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

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
            quote: 'Interactive Ideas transformed how I collaborate on design concepts. The feedback I received on my app idea led to a successful funding round!',
        },
        {
            name: 'Marcus Chen',
            role: 'Entrepreneur & Innovator',
            image: 'https://randomuser.me/api/portraits/men/6.jpg',
            quote: 'Found my perfect co-founder through Interactive Ideas! We went from initial concept to prototype in just 6 months.',
        },
        {
            name: 'Priya Sharma',
            role: 'Technology Startup Founder',
            image: 'https://randomuser.me/api/portraits/women/7.jpg',
            quote: 'The community validation on Interactive Ideas gave me the confidence to quit my job and build my startup full-time.',
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
            quote: "Interactive Ideas creates a safe space for innovation. Every idea gets proper analysis and constructive feedback from industry experts.",
        },
        {
            name: 'David Morales',
            role: 'Serial Entrepreneur',
            image: 'https://randomuser.me/api/portraits/men/2.jpg',
            quote: 'From concept to launch, I collaborated with 15 different creators on Interactive Ideas. Together we built something amazing!',
        },
        
    ]

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
    const result: Testimonial[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3))

export default function WallOfLoveSection() {
    return (
        <div className="max-w-4xl mx-auto">
            <section>
                <div className="py-16 md:py-32">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-semibold">Trusted by Innovators Worldwide</h2>
                            <p className="mt-6">Join thousands of creators who have found collaboration partners, funding opportunities, and inspiration through our platform.</p>
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12">
                            {testimonialChunks.map((chunk, chunkIndex) => (
                                <div
                                    key={chunkIndex}
                                    className="space-y-3">
                                    {chunk.map(({ name, role, quote, image }, index) => (
                                        <Card key={index} className="p-4">
                                            <CardContent className="px-6 grid grid-cols-[auto_1fr] gap-3 pt-0">
                                                <Avatar className="size-9">
                                                    <AvatarImage
                                                        alt={name}
                                                        src={image}
                                                        loading="lazy"
                                                        width="120"
                                                        height="120"
                                                    />
                                                    <AvatarFallback>ST</AvatarFallback>
                                                </Avatar>

                                                <div>
                                                    <h3 className="font-medium">{name}</h3>

                                                    <span className="text-muted-foreground block text-sm tracking-wide">{role}</span>

                                                    <blockquote className="mt-3">
                                                        <p className="text-gray-700 dark:text-gray-300">{quote}</p>
                                                    </blockquote>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
