// --- Component ---
import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/hooks/use-debounced-dimensions";

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
      ? "blur-3xl"
      : "blur-[100px]";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {colors.map((color, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient"
            style={
              {
                top: `${Math.random() * 50}%`,
                left: `${Math.random() * 50}%`,
                "--background-gradient-speed": `${1 / speed}s`,
                "--tx-1": Math.random() - 0.5,
                "--ty-1": Math.random() - 0.5,
                "--tx-2": Math.random() - 0.5,
                "--ty-2": Math.random() - 0.5,
                "--tx-3": Math.random() - 0.5,
                "--ty-3": Math.random() - 0.5,
                "--tx-4": Math.random() - 0.5,
                "--ty-4": Math.random() - 0.5,
              } as React.CSSProperties
            }
            width={circleSize * randomInt(0.5, 1.5)}
            height={circleSize * randomInt(0.5, 1.5)}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={color}
              className="opacity-30 dark:opacity-[0.15]"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

export { AnimatedGradient };


// // --- Demo ---
// import React from "react"
// import { motion } from "framer-motion"

// import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg"

// interface BentoCardProps {
//   title: string
//   value: string | number
//   subtitle?: string
//   colors: string[]
//   delay: number
// }

// const BentoCard: React.FC<BentoCardProps> = ({
//   title,
//   value,
//   subtitle,
//   colors,
//   delay,
// }) => {
//   const container = {
//     hidden: { opacity: 0 },
//     show: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: delay + 0.3,
//       },
//     },
//   }

//   const item = {
//     hidden: { opacity: 0 },
//     show: { opacity: 1, transition: { duration: 0.5 } },
//   }

//   return (
//     <motion.div
//       className="relative overflow-hidden h-full bg-background dark:bg-background/50" // Изменено здесь
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5, delay }}
//     >
//       <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
//       <motion.div
//         className="relative z-10 p-3 sm:p-5 md:p-8 text-foreground backdrop-blur-sm" // Добавлен backdrop-blur
//         variants={container}
//         initial="hidden"
//         animate="show"
//       >
//         <motion.h3 
//           className="text-sm sm:text-base md:text-lg text-foreground" 
//           variants={item}
//         >
//           {title}
//         </motion.h3>
//         <motion.p
//           className="text-2xl sm:text-4xl md:text-5xl font-medium mb-4 text-foreground"
//           variants={item}
//         >
//           {value}
//         </motion.p>
//         {subtitle && (
//           <motion.p 
//             className="text-sm text-foreground/80" 
//             variants={item}
//           >
//             {subtitle}
//           </motion.p>
//         )}
//       </motion.div>
//     </motion.div>
//   )
// }

// const AnimatedGradientDemo: React.FC = () => {
//   return (
//     <div className="w-full bg-background h-full">
//       <div className="grid grid-cols-1 md:grid-cols-3 grow h-full">
//         <div className="md:col-span-2">
//           <BentoCard
//             title="Total Revenue"
//             value="$1,234,567"
//             subtitle="15% increase from last month"
//             colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
//             delay={0.2}
//           />
//         </div>
//         <BentoCard
//           title="New Users"
//           value={1234}
//           subtitle="Daily signups"
//           colors={["#60A5FA", "#34D399", "#93C5FD"]}
//           delay={0.4}
//         />
//         <BentoCard
//           title="Conversion Rate"
//           value="3.45%"
//           subtitle="0.5% increase from last week"
//           colors={["#F59E0B", "#A78BFA", "#FCD34D"]}
//           delay={0.6}
//         />
//         <div className="md:col-span-2">
//           <BentoCard
//             title="Active Projects"
//             value={42}
//             subtitle="8 completed this month"
//             colors={["#3B82F6", "#A78BFA", "#FBCFE8"]}
//             delay={0.8}
//           />
//         </div>
//         <div className="md:col-span-3">
//           <BentoCard
//             title="Customer Satisfaction"
//             value="4.8/5"
//             subtitle="Based on 1,000+ reviews from verified customers across all product categories"
//             colors={["#EC4899", "#F472B6", "#3B82F6"]}
//             delay={1}
//           />
//         </div>
//       </div>
//     </div>
//   )
// }

// export { AnimatedGradientDemo }