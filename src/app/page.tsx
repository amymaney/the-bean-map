"use client";

import React, { useEffect, useState } from "react";
import CoffeeShopCard from "./components/CoffeeShopCard";
import { useSession, signIn } from "next-auth/react";
import dynamic from 'next/dynamic';
import Header from "./components/Header";
import type { CoffeeShop, Coffee } from "./types";
import SkeletonHomePage from "./components/SkeletonHomePage";

// lazy loads map (only client-side)
const Map = dynamic(()=> import('./components/Map'), {ssr: false})

export default function HomePage(){
  const { data: session, status } = useSession();

  // storing AdvancedMarkerElement objects for each coffee shop (Google maps custom markers)
  const [markerMap, setMarkerMap] = useState<{ [id: number]: google.maps.marker.AdvancedMarkerElement }>({});

  const isLoggedIn = !!session;
  const [loading, setLoading] = useState(true);
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [fiveStarCoffee, setFiveStarCoffee] = useState<Coffee>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top 4 coffee shops
        const response = await fetch(`/api/coffee-shops?limit=4`);
        if (!response.ok) throw new Error("Failed to fetch coffee shops");
        const data = await response.json();
        setCoffeeShops(data);
  
        let topCoffeeShops = '';
        if (Array.isArray(data)) {
          topCoffeeShops = data.map((coffeeShop: CoffeeShop) => coffeeShop.coffeeShopId).join(',');
        } else {
          console.error('Expected array but got:', data);
        }
  
        // Fetch a 5 star coffee - exclude any from one of the top coffee shops already shown
        const fiveStarResponse = await fetch(`/api/coffees?rating=5&noUser=true&limit=1&excludeShopIds=${topCoffeeShops}`);
        if (!fiveStarResponse.ok) throw new Error("Failed to fetch coffee");
        const fiveStarData = await fiveStarResponse.json();
        setFiveStarCoffee(fiveStarData[0]);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  // Mouse hover handlers to scale up/down the map markers
  const handleMouseEnter = (id: number) => {
    const marker = markerMap[id];
    if (marker && marker.content instanceof HTMLElement) {
      marker.content.style.transform = "scale(1.5)"; 
      marker.content.style.transition = "transform 0.2s ease";
    }
  };
  const handleMouseLeave = (id: number) => {
    const marker = markerMap[id];
    if (marker && marker.content instanceof HTMLElement) {
      marker.content.style.transform = "scale(1)";
    }
  };
  
  if (loading) {
    return (
      <div>
        <SkeletonHomePage />
      </div>
    );
  }

  return(
    <div>
      <Header isLoggedIn={isLoggedIn} activePage="home" />

      <div className="bg-[#f7edda] min-h-screen flex flex-col items-center pt-3">

        {/* displays user email if logged in (desktop only) */}
        <h3 className="hidden sm:block text-[#6F4E37] self-end pr-6">{session?.email}</h3>

        {/* title and subtitle */}
        <div className="mb-8">
          <h1 className="text-[#6F4E37] text-center text-5xl font-roboto-mono pb-3 pt-2">the bean map</h1>
          <h2 className="text-[#6F4E37] text-lg lg:text-xl">for londoners who like their coffee on the rocks.</h2>
        </div>

        <div className="flex flex-col lg:flex-row justify-between w-full px-4 lg:px-20 gap-3 lg:gap-8">

          {/* left: coffee shop list */}
          <div className="w-full lg:w-3/5">
            <h3 className="text-[#6F4E37] text-lg lg:text-xl text-center lg:text-left">top coffee shops</h3>
            <div className="lg:space-y-6 space-y-4  mt-4 lg:mb-10">
              {coffeeShops?.map((coffeeShop) => (
                <CoffeeShopCard
                  key={coffeeShop.id} 
                  coffeeShop={coffeeShop} 
                  onHover={() => handleMouseEnter(coffeeShop.id)}
                  onLeave={() => handleMouseLeave(coffeeShop.id)}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:w-2/5 px-2 py-2 space-y-4 flex flex-col">

            {/* sign in buttons (shown if not logged in) - hidden on mobile */}
            <div className="hidden sm:flex flex-row gap-5 w-full items-center">
              {!isLoggedIn&&(
                <>
                  <button 
                    onClick={() => signIn("google", { callbackUrl: process.env.NEXTAUTH_URL || "http://localhost:3000" })}
                    className="bg-[#FFFCF4] w-full px-3 py-3 rounded-3xl cursor-pointer text-center flex items-center justify-center
                      transition-all duration-200 hover:shadow-lg shadow-md">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/240px-Google_%22G%22_logo.svg.png"
                      alt="Google logo"
                      className="w-7 h-7 mr-5"
                    />
                    <h3 className="text-[#4C3730] text-lg lg:text-xl">Sign in with Google</h3>
                  </button>
                  <button 
                    onClick={() => signIn("microsoft", { callbackUrl: process.env.NEXTAUTH_URL || "http://localhost:3000" })}
                    className="bg-[#FFFCF4] w-full px-3 py-3 rounded-3xl cursor-pointer text-center flex items-center justify-center
                      transition-all duration-200 hover:shadow-lg shadow-md">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png"
                      alt="Google logo"
                      className="w-6 h-6 mr-5"
                    />
                    <h3 className="text-[#4C3730] text-lg lg:text-xl">Sign in with Microsoft</h3>
                  </button>
                </>
              )}
            </div>
            
            {/* 5 star coffee spotlight */}
            {isLoggedIn&&(
              <>  
                <h3 className="text-[#6F4E37] mt-2 lg:mt-0 text-lg lg:text-xl text-center lg:text-left">5⭐ coffee spotlight</h3>
                <div 
                  onMouseEnter={() => {
                    if (fiveStarCoffee?.coffeeShop?.id !== undefined) {
                      handleMouseEnter(fiveStarCoffee.coffeeShop.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (fiveStarCoffee?.coffeeShop?.id !== undefined) {
                      handleMouseLeave(fiveStarCoffee.coffeeShop.id);
                    }
                  }}
                  className="w-full bg-[#FFFCF4] shadow-md lg:py-5 px-6 py-4 rounded-3xl mb-5 flex justify-between
                    transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border border-transparent hover:border-[#6F4E37]"
                >
                  <div className="">
                    <h2 className="text-[#6F4E37] text-lg lg:text-xl font-extrabold">{fiveStarCoffee?.name}</h2>
                    <h3 className="text-[#6F4E37] text-md lg:text-lg">{fiveStarCoffee?.coffeeShop?.name} - £{fiveStarCoffee?.price}</h3>
                  </div>
                  <div className=" text-right">
                    <h2 className="text-md" style={{ color: "rgba(111, 78, 55, 0.75)" }}>{fiveStarCoffee?.description}</h2>
                  </div>
                </div>
              </>
            )}
           
           {/* map featuring top coffee shops displayed */}
            <Map 
              coffeeShops={coffeeShops} 
              onMarkersReady={setMarkerMap} 
              highlightedCoffee={isLoggedIn ? fiveStarCoffee : null }
              isLoggedIn={isLoggedIn}
              className={`w-full rounded-3xl mt-1.5 mb-4 
                ${isLoggedIn ? 'h-[412px]' : 'h-[510px]'} 
              `}
            />

          </div>
        </div>
       
      </div>
    </div>
  )

};

