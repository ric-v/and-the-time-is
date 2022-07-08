import type { NextPage } from "next";
import { Component } from "react";
import Footer from "../components/Footer";
import Main from "../components/Main";
import Navbar from "../components/Navbar";

const Home: NextPage = () => {
  return (
    <div className='flex flex-col justify-between min-h-full min-w-full bg-gradient-to-br from-slate-700 to-slate-900'>
      <div>
        <Navbar />
        <Main />
      </div>
      <Footer hidden="/" />
    </div>
  );
};

export default Home;
