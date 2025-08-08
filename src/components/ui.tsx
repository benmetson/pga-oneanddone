import { motion } from "framer-motion";
import { clsx } from "clsx";
export function Card({children, className}:{children: React.ReactNode, className?:string}){
  return <motion.div initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} className={clsx("card", className)}>{children}</motion.div>
}
export function Stat({label, value}:{label:string, value:string}){
  return (<div className="flex justify-between items-baseline py-2"><span className="text-gray-400">{label}</span><span className="text-2xl font-semibold">{value}</span></div>)
}
export function H1({children}:{children:React.ReactNode}){ return <h1 className="h1 mb-4">{children}</h1> }
export function Button({children, onClick, variant="default"}:{children:React.ReactNode, onClick?:()=>void, variant?: "default"|"primary"}){
  return <button onClick={onClick} className={clsx("btn", variant==="primary" && "btn-primary")}>{children}</button>
}
