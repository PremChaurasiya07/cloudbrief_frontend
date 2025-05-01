export default async function History({user_id}: {user_id: string}) {
const response = await fetch(`http://localhost:7860/api/v1/monitor/messages?flow_id=8aab738a-51cc-4175-8694-7d4aa96e377b&session_id=${user_id}&order_by=timestamp&order=asc`)
const data = await response.json();
return data; // Adjust this based on the actual structure of the JSON response
}