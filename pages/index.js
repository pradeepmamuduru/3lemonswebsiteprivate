import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    const response = await fetch('https://sheetdb.io/api/v1/q6ryvlhjjmu4q', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: formData })
    });

    if (response.ok) {
      setFormData({ name: '', email: '', message: '' });
      setStatus('Thank you for your message!');
    } else {
      setStatus('Failed to send message. Please try again.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to 3 Lemons Website</h1>
      <Image src="/lemons-with-leaves.jpg" alt="Lemons with Leaves" width={800} height={500} />

      <section style={{ marginTop: '2rem' }}>
        <h2>About Our Lemons</h2>
        <p>
          Our lemons are farm fresh and organically grown with love. We ensure the best quality and rich flavor in every piece.
        </p>
        <Image src="/sliced-lemon.jpg" alt="Sliced Lemon" width={800} height={500} />
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Our Orchard</h2>
        <Image src="/lemon-tree.jpg" alt="Lemon Tree" width={800} height={500} />
        <p>
          Explore our lemon orchards that span over acres, growing the finest citrus fruits in the region.
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Freshly Squeezed</h2>
        <Image src="/lemon-juice.jpg" alt="Lemon Juice" width={800} height={500} />
        <p>
          Try our natural lemon juice, squeezed from premium lemons for the perfect zest and taste.
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Contact Us</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem' }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem' }}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            style={{ padding: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#fcd34d', border: 'none', cursor: 'pointer' }}>
            Submit
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>{status}</p>
      </section>

      <footer style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
        <p>&copy; 2025 3 Lemons. All rights reserved.</p>
      </footer>
    </div>
  );
}
