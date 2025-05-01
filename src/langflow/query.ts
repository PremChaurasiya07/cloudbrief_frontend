export default async function query(query: string) {
    const response = await fetch("http://localhost:7860/api/v1/run/8aab738a-51cc-4175-8694-7d4aa96e377b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
         "authorization": "Bearer AstraCS:PWGAHEDHhAyOcyImnuOwHmuC:c1bb4bb650911c095fe40b26354c4e910e4490a02200cc4976e72cf900a0d992",
        },
        body: JSON.stringify({
          "input_value":query,
          "input_type": "chat",
          "output_type": "chat",
           "session_id": "user_2"
        }),
      });
      const data = await response.json().then((data) => data.outputs[0].outputs[0].outputs.message.message).catch((error) => {
        console.error("Error fetching summary:", error);
      });
      return data
}

