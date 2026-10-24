import { Link } from 'react-router-dom'
import './home.css'

export default function Home() {
    return <section className='home'>
        <div className='top'>
            <h1>Selamat Datang di FC Bayern Store</h1>
            <Link to='/products'>Lihat Semua Produk</Link>
        </div>

        <div className="video-container">
            <iframe
                src="https://www.youtube.com/embed/kHKAqRZg9RE?autoplay=1&mute=1&playsinline=1"
                title="YouTube video"
                allow='autoplay; encrypted-media'
                allowFullScreen
            ></iframe>
            </div>

    </section>
}
