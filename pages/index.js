<div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-blue-100 font-sans">
  ...
  <section className="relative bg-opacity-30 rounded-xl overflow-hidden mb-10">
    <img
      src="/lemons-hero.jpg"
      alt="Fresh Lemons"
      className="w-full h-96 object-cover opacity-60 rounded-xl"
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-blue-100 z-10 p-4">
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-lg">3 Lemons Traders</h1>
      <p className="text-xl sm:text-2xl font-medium drop-shadow-lg">Buy fresh, farm-direct lemons delivered across India</p>
      <a href="#buy-now" className="inline-block mt-6 px-6 py-3 bg-blue-800 text-white rounded-full font-semibold shadow-lg hover:bg-blue-900 transition">
        Order Now
      </a>
    </div>
  </section>

  <section className="bg-blue-800 bg-opacity-90 p-6 rounded-xl">
    <h2 className="text-4xl font-bold mb-6 text-blue-100">Our Lemons</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {lemons.map((lemon, index) => (
        <div key={index} className="bg-blue-700 p-4 rounded-xl shadow-md">
          {/* Image unchanged */}
          <p className="mt-3 font-bold text-lg text-blue-200">{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</p>
          <p className="text-blue-300">{lemon['Description']}</p>
        </div>
      ))}
    </div>
  </section>

  <section id="buy-now" className="bg-blue-800 bg-opacity-90 p-8 rounded-xl shadow-lg">
    <h2 className="text-4xl font-bold mb-6 text-blue-100">Buy Now</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Inputs unchanged except border color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name"
          required
          className="border border-blue-300 rounded p-3 w-full bg-blue-900 text-blue-100"
        />
        <input
          type="text"
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="10-digit Mobile Number"
          maxLength={10}
          required
          className="border border-blue-300 rounded p-3 w-full bg-blue-900 text-blue-100"
        />
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          placeholder="Quantity (kg)"
          required
          className="border border-blue-300 rounded p-3 w-full bg-blue-900 text-blue-100"
        />
        <select
          name="quality"
          value={form.quality}
          onChange={handleChange}
          className="border border-blue-300 rounded p-3 w-full bg-blue-900 text-blue-100"
        >
          <option value="A1">A1 – ₹80/kg</option>
          <option value="A2">A2 – ₹70/kg</option>
          <option value="A3">A3 – ₹60/kg</option>
        </select>
        <input
          type="text"
          name="delivery"
          value={form.delivery}
          onChange={handleChange}
          placeholder="Delivery Address"
          required
          className="border border-blue-300 rounded p-3 w-full md:col-span-2 bg-blue-900 text-blue-100"
        />
      </div>

      <div className="text-lg font-medium text-blue-200">
        Total Price: ₹{totalPrice} {isBulk && <span className="text-sm text-blue-300">(10% bulk discount applied)</span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition"
        >
          {isSubmitting ? 'Submitting...' : 'Place Order'}
        </button>
        <a
          href={getWhatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-6 py-3 border border-blue-800 text-blue-800 rounded-lg hover:bg-blue-100 hover:text-blue-900 transition"
        >
          <FaWhatsapp className="mr-2" /> Order via WhatsApp
        </a>
      </div>

      {orderStatus && (
        <p className="mt-4 text-center font-semibold text-blue-200">{orderStatus}</p>
      )}
    </form>
  </section>
</div>
