export default async function Summary() {
  const response = await fetch("http://localhost:7860/api/v1/run/82210fd6-eddd-4968-a3db-87ba818c8503", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       "authorization": "Bearer AstraCS:PWGAHEDHhAyOcyImnuOwHmuC:c1bb4bb650911c095fe40b26354c4e910e4490a02200cc4976e72cf900a0d992",
      },
      body: JSON.stringify({
        "input_value":"",
        "input_type": "chat",
        "output_type": "chat",
         "session_id": "user_3"
      }),
    });
    const data = await response.json().then((data) => data.outputs[0].outputs[0].results.message.data.text).catch((error) => {
      console.error("Error fetching summary:", error);
    });
    return data
}