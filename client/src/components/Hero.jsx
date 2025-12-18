import React from 'react'
import { useNavigate } from 'react-router-dom';
import { assets } from "../assets/assets";

const Hero = () => {
  const navigate = useNavigate();
  const companyLogos = ["slack", "framer", "netflix", "google", "linkedin", "instagram", "facebook"];

  return (
    <>
      <style>{`
                .marquee-inner {
                    animation: marqueeScroll linear infinite;
                }

                @keyframes marqueeScroll {
                    0% {
                        transform: translateX(0%);
                    }

                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
      <div className='top-0 px-4 sm:px-20 xl:px-32 relative inline-flex flex-col w-full justify-center bg-[url(/gradientBackground.png)] bg-cover bg-no-repeat min-h-screen'>

        <div className='text-center mb-5 mt-20'>
          <h1 className='text-3xl sm:text-5xl md:text-6xl 2xl:text-7xl font-semibold mx-auto leading-[1.2]'>Create amazing content <br /> with <span className='text-primary'>AI tools</span></h1>
          <p className='mt-4 max-w-xs sm:max-w-lg 2xl:max-w-xl m-auto max-sm:text-xs text-gray-600 '>Transform your content creation with our suite of premium AI tools. Write articles, generate images, and enhance your workflow.</p>
        </div>
        <div className='flex flex-wrap justify-center gap-4 text-sm max-sm:text-xs'>
          <button onClick={() => navigate('/ai')} className='bg-primary text-white px-8 py-3 rounded-lg hover:scale-102 active:scale-95 transition cursor-pointer'>Start creating now</button>
          <button className='bg-white px-8 py-3 rounded-lg border border-gray-300 hover:scale-102 active:scale-95 transition cursor-pointer'>Watch demo</button>
        </div>
        <div className='flex items-center gap-4 mt-8 mx-auto text-gray-600 mb-20'>
          <img src={assets.user_group} alt="" className='h-8' /> Trusted by 10k+ people
        </div>
        <div className="overflow-hidden w-full relative max-w-5xl mx-auto select-none">
          <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
          <div className="marquee-inner flex will-change-transform min-w-[200%]" style={{ animationDuration: "15s" }}>
            <div className="flex">
              {[...companyLogos, ...companyLogos].map((company, index) => (
                <img key={index} src={`https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/${company}.svg`}
                  alt={company} className="w-full h-full object-cover mx-6" draggable={false} />
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </>
  )
}

export default Hero;
