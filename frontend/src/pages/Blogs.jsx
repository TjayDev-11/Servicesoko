import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import blogs from '../blogs.json';

const Blogs = () => {
  const [category, setCategory] = useState('all');
  const categories = ['all', 'plumbing', 'electrical', 'cleaning', 'carpentry'];
  const filteredBlogs = category === 'all' ? blogs : blogs.filter(blog => blog.category === category);

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Helmet>
        <title className='container mt-5'>Blog - Home Services in Nairobi | ServiceSoko</title>
        <meta name="description" content="Tips for plumbing, electrical, cleaning, and carpentry services in Nairobi." />
        <meta name="keywords" content="plumbers in Nairobi, electricians in Nairobi, cleaning services Nairobi, carpenters Nairobi" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6 text-center">Nairobi Home Services Blog</h1>
      <div className="flex justify-center mb-6 space-x-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.length === 0 ? (
          <p className="text-center col-span-full">No posts available.</p>
        ) : (
          filteredBlogs.map(post => (
            <div key={post.id} className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <Link to={`/blogs/${post.slug}`} className="text-blue-600 hover:underline">Read More</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Blogs;