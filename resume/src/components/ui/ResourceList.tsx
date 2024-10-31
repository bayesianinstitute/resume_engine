import { PrepResource } from "@/types/interview"
import { motion } from "framer-motion"
import React from "react"

export const ResourceList = ({ resources, icon: Icon }: { resources: PrepResource[], icon: React.ElementType }) => {
  return (
    <div className="space-y-4 mt-4">
    {resources.map((resource, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="border-b border-gray-200 pb-4 last:border-b-0"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
          <Icon className="w-5 h-5 mr-2 text-blue-500" />
          {resource.title}
        </h3>
        <div className="text-gray-600 dark:text-gray-300 space-y-2">
          {resource.content.split("\n").map((item, i) => (
            <p key={i}>{item.trim()}</p>
          ))}
        </div>
      </motion.div>
    ))}
  </div>
  )
}
