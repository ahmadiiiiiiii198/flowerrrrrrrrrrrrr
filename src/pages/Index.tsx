
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import Products from '../components/Products';
import About from '../components/About';
import Footer from '../components/Footer';
// Comprehensive fixes implemented for navbar and logo loading


const Index = () => {
  return (
    <div className="min-h-screen font-inter overflow-x-hidden">
      <Header />
      <ErrorBoundary componentName="Hero">
        <div className="animate-fade-in-up">
          <Hero />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Categories">
        <div className="animate-fade-in-left animate-stagger-1">
          <Categories />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Products">
        <div className="animate-fade-in-right animate-stagger-2">
          <Products />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="About">
        <div className="animate-slide-in-up animate-stagger-3">
          <About />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Footer">
        <div className="animate-fade-in-up animate-stagger-4">
          <Footer />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default Index;
