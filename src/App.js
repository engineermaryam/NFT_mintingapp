import { useState } from "react";
import axios from 'axios';
import { NFTStorage } from "nft.storage";

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile] = useState(null);

  const generateArt = async () => {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          inputs: prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}`,
          },
          responseType: "blob",
        }
      );

      // convert blob to an image file type 
      const imageFile = new File([response.data], "image.png", {
        type: "image/png",
      });
       
      // saving the image file in a state
      setFile(imageFile);

      const url = URL.createObjectURL(response.data);
      console.log(url);
      setImageBlob(url);
    } catch (err) {
      console.log(err);
    }
  };

  const uploadArtToIpfs = async () => {
    try {
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_NFT_STORAGE,
      });
    
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file,
      });

      return cleanupIPFS(store.data.image.href);
    } catch(err) {
      console.log(err);
      return null;
    }
  };
  
  const cleanupIPFS = (url) => {
    if (url && url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return url;
  };
  
  const mintNft = async () => {
    try {
      const imageURL = await uploadArtToIpfs();

      const nftPortToken = process.env.REACT_APP_NFT_PORT;

      if (!nftPortToken) {
        console.error("NFTPort API token is missing. Please check the .env configuration.");
        return;
      }

      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: "Sample NFT",
          description: "Build with NFTPort!",
          mint_to_address: "0xb1e518a4694a58b9184125497510430B58EB0C41",
        },
        {
          headers: {
            Authorization: `Bearer ${nftPortToken}`,
          },
        }
      );
      const data = await response.data;
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless mints</h1>
      <div className="flex flex-col items-center justify-center">
        {/* Create an input box and button saying "Next" beside it */}
        <div className="flex items-center justify-center gap-4">
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setPrompt(e.target.value)}
            type="text"
            placeholder="Enter a prompt"
          />
          <button onClick={generateArt} className="bg-black text-white rounded-md p-2">Next</button>
        </div>
        {imageBlob && (
          <div className="flex flex-col gap-4 items-center justify-center">
            <img src={imageBlob} alt="AI generated art" />
            <button
              onClick={mintNft}
              className="bg-black text-white rounded-md p-2"
            >
              Mint NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
