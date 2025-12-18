import { ArrowRight } from 'lucide-react';
import React from 'react'
import { assets } from "../assets/assets";
import { useNavigate } from 'react-router-dom'
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { openSignIn } = useClerk();

    return (
        <nav className='fixed z-5 w-full backdrop-blur-2xl flex justify-between items-center top-0 py-3 px-4 sm:px-20 xl:px-32'>
            <img src={assets.logo} alt="logo" className='w-32 sm:w-44 cursor-pointer' onClick={() => { navigate('/') }} />
            {
                user ? <UserButton /> : (
                    <button onClick={openSignIn} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-8 py-2.5'>Get started <ArrowRight className='w-4 h-4' /> </button>
                )
            }

        </nav>
    )
}

export default Navbar
