import PostList from '../components/PostList';
import SearchBar from '../components/SearchBar';
import { useState } from 'react';

function Dashboard({ user }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} />
          <PostList user={user} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;