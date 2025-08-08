import { NextPage } from 'next';
import Head from 'next/head';

const AdminPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Vikareta Admin Panel</title>
        <meta name="description" content="Vikareta Admin Dashboard" />
      </Head>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Vikareta Admin Panel</h1>
        <p>Manage your B2B marketplace</p>
        <div style={{ marginTop: '2rem' }}>
          <button style={{ margin: '0.5rem', padding: '1rem 2rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px' }}>
            User Management
          </button>
          <button style={{ margin: '0.5rem', padding: '1rem 2rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px' }}>
            Product Management
          </button>
        </div>
      </main>
    </>
  );
};

export default AdminPage;
