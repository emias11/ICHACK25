# ICHACK25 - CheetCode

#### Please see `CheetCodeDemo.mp4` for demonstration
Sorry this didn't work in the live demo! Hard-coded IP changed due to moving to another part of campus, should have hosted on the cloud :(

![image](https://github.com/user-attachments/assets/c8c6778b-e7a8-4eae-b834-59b7c0298580)


### Setup

```bash
cd cheetcode
```
Group installations
```bash
npm install @radix-ui/react-slot lucide-react class-variance-authority clsx tailwind-merge
```
Install shadcn/ui
```bash
npm install -D @shadcn/ui
```
Install express
```bash
npm install express node-fetch @types/express 
npm install concurrently --save-dev
```
Install `requests`, preferrably using a venv:
```bash
pip install requests
```
___

# Running the Program

1. Set your local IP address in both `gameserver/send_query.py` and `cheetcode/pages/index.tsx`
2. Run `npm run dev -- -H 0.0.0.0` from `cheetcode/`
3. Visit `http://YOUR_HOST_IP_ADDRESS:3000` from a mobile device
4. Run `python3 send_query.py` from `gameserver/`



Note that due to a bug with the ChatGPT API that we didn't figure out, you will need to keep re-running the `send_query` file until it says `Sending POST request`. Occasionally ChatGPT returns a string that cannot be parsed for some reason. 
