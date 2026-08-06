import { Spinner, RingLoader, DotsLoader, BounceLoader } from './ui/spinner'

export default function SpinnerDemo() {
  return (
    <div className="p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Loading Spinner Showcase</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* LDRS Reuleaux Spinner */}
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
          <h3 className="text-lg font-semibold">Reuleaux Spinner</h3>
          <Spinner size={50} />
          <p className="text-sm text-muted-foreground text-center">
            Beautiful LDRs Reuleaux spinner with custom properties
          </p>
        </div>

        {/* Ring Loader */}
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
          <h3 className="text-lg font-semibold">Ring Loader</h3>
          <RingLoader size={50} />
          <p className="text-sm text-muted-foreground text-center">
            Simple CSS ring spinner
          </p>
        </div>

        {/* Dots Loader */}
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
          <h3 className="text-lg font-semibold">Dots Loader</h3>
          <DotsLoader size={32} />
          <p className="text-sm text-muted-foreground text-center">
            Three dots with staggered animation
          </p>
        </div>

        {/* Bounce Loader */}
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
          <h3 className="text-lg font-semibold">Bounce Loader</h3>
          <BounceLoader size={32} />
          <p className="text-sm text-muted-foreground text-center">
            Classic bounce animation
          </p>
        </div>
      </div>

      <div className="mt-8 p-6 border rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Usage Examples</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Import spinner components:</h3>
            <code className="block bg-muted p-3 rounded text-sm">
              {`import { Spinner, RingLoader, DotsLoader, BounceLoader } from './ui/spinner'`}
            </code>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Use in your components:</h3>
            <code className="block bg-muted p-3 rounded text-sm">
              {`<Spinner size={40} />  
<RingLoader size={32} />  
<DotsLoader size={24} />  
<BounceLoader size={28} />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
