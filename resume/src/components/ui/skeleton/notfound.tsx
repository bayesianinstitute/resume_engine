import Image from "next/image";
import React from "react";

export const Datanotfound = ({ msg }: { msg: string }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src="https://img.freepik.com/free-vector/hand-drawn-no-data-concept_52683-127823.jpg?t=st=1730460123~exp=1730463723~hmac=354f8eed93247a4e88cd28d0ccc7a3cfd1eb3ba9e99e6d3a3ef3cb9b0ec1a144&w=996"
        //                     src=
        // "https://media.geeksforgeeks.org/wp-content/uploads/20230816191453/gfglogo.png"
        alt="No Data"
        unoptimized
        width={150}
        height={150}
        style={{ aspectRatio: "150/150", objectFit: "cover" }}
      />

      <h2 className="text-lg font-semibold">{msg}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        please upload your resume{" "}
      </p>
    </div>
  );
};
