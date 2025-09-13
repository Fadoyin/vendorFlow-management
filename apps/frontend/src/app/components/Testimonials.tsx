export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-revtrack-primary">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-revtrack-text-primary sm:text-4xl">
            What Our Customers Say
          </p>
                  <p className="mt-6 text-lg leading-8 text-revtrack-text-secondary">
          Hear from businesses that have transformed their operations with VendorFlow.
        </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {/* Testimonial 1 */}
          <div className="revtrack-card p-8">
            <div className="flex items-center gap-x-4 text-sm leading-6 text-revtrack-text-secondary mb-4">
              <div className="w-8 h-8 bg-revtrack-primary/10 rounded-full flex items-center justify-center">
                <span className="text-revtrack-primary font-semibold">S</span>
              </div>
              <div>
                <div className="font-semibold text-revtrack-text-primary">Sarah Chen</div>
                <div>Operations Director, GlobalTech Solutions</div>
              </div>
            </div>
            <blockquote className="text-lg leading-8 text-revtrack-text-primary">
              "VendorFlow has revolutionized our supply chain management. The real-time tracking and vendor collaboration features have reduced our inventory costs by 30% and improved our order fulfillment rate significantly."
            </blockquote>
          </div>

          {/* Testimonial 2 */}
          <div className="revtrack-card p-8">
            <div className="flex items-center gap-x-4 text-sm leading-6 text-revtrack-text-secondary mb-4">
              <div className="w-8 h-8 bg-revtrack-success/10 rounded-full flex items-center justify-center">
                <span className="text-revtrack-success font-semibold">M</span>
              </div>
              <div>
                <div className="font-semibold text-revtrack-text-primary">Michael Lee</div>
                <div>Procurement Manager, Innovate Manufacturing</div>
              </div>
            </div>
            <blockquote className="text-lg leading-8 text-revtrack-text-primary">
              "The vendor management module is a game-changer. We've streamlined our supplier relationships and automated our procurement process, saving us countless hours every week."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
