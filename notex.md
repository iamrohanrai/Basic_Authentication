Why not user.save() after delete?

Jab tum findByIdAndDelete call karte ho, MongoDB se poora document delete ho jaata hai.

Ab user object sirf memory me hai, DB me nahi.

Agar tum user.save() dobara call karoge to wo user ko fir se insert kar dega (kya tum chahte ho? 😅).

Isliye rollback pattern me delete karne ke baad dobara save() bilkul nahi karna chahiye.

User jo tumne import kiya hai, wo Model hai (class jaisa).

user jo tumne findOne se nikala, wo us Model ka document instance hai (matlab ek actual row/record ka object).

Ab:

User.save() ❌ — Model pe direct save() method hota hi nahi, isliye kaam nahi karega.

user.save() ✅ — Document instance pe save() method hota hai jo usi document ko DB me update/save karta hai.

// Jwt secret

1. JWT ka payload sirf encode hota hai, encrypt nahi

isliye koi bhi insaan JWT token ko decode karke andar ka JSON dekh lega.

example payload:

{
"id": "12345",
"email": "rohan@gmail.com",
"exp": 1694512000
}

ye sab public dikh jaayega — yahi tumne dekha.

🔒 2. Secret ka role — Signature banata hai

JWT ke 3 parts hote hain:

header.payload.signature

header.payload → base64 encoded (sabko dikh jaata hai)

signature → isko banane ke liye server karta hai:

HMACSHA256(header + "." + payload, JWT_SECRET)

Matlab secret ke bina signature valid ban hi nahi sakta.

⚠️ Without Secret (Problem kya hoga?)

Maan lo attacker tumhara JWT decode karta hai, id change karke id=9999 kar deta hai aur dubara encode karta hai.

agar secret na ho, toh attacker ne fake token banake kisi aur ka account access kar liya. 😱

✅ With Secret

Jab attacker modify karega:

uska signature invalid ho jaayega.

server jwt.verify(token, JWT_SECRET) karega aur bolega "Invalid token".

👉 Yahi wajah hai ki secret JWT ke liye mandatory hai.
Secret ke bina koi bhi apna fake token bana lega.

🔑 Summary:

Secret payload ko hide nahi karta ❌ (wo sirf encode hota hai).

Secret ensure karta hai ki token tamper-proof ho ✅.

// IMPORTNAT CONCEPT OF MIDDLEWARE

Ye middleware ke kaam karne ka core funda hai.

1. req object kya hota hai?

Express har incoming HTTP request ke liye ek req (request) aur ek res (response) object banata hai.

Ye objects JavaScript objects hi hote hain, tum unme apni custom properties add kar sakte ho.

Example:

app.use((req, res, next) => {
req.hello = "world";
next();
});

app.get("/", (req, res) => {
res.send(req.hello); // "world"
});

👉 Dekha? Tumne req object ke andar apna khud ka property add kiya.

2. Ab tumhare middleware me kya ho raha hai?
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   req.user = decoded;
   next();

decoded ek object hai jo JWT se mila, e.g.:

{ "id": "66e348ccf1...", "iat": 1726300000, "exp": 1726386400 }

Tumne is object ko req.user property me daal diya.

Ab jab request aage next middleware ya route handler pe jaayegi → req.user available hoga.

3. Access kaise hoga?

Jab koi route call hoga aur uske pehle tumne isLoggedIn middleware lagaya hai, to route handler ke andar req.user directly access kar sakte ho.

Example:

app.get("/profile", isLoggedIn, (req, res) => {
// isLoggedIn ne req.user me JWT ka decoded payload daal diya
res.json({ message: "Welcome!", user: req.user });
});

Response:

{
"message": "Welcome!",
"user": {
"id": "66e348ccf1...",
"iat": 1726300000,
"exp": 1726386400
}
}

4. Ye possible kaise hai?

Kyunki req ek mutable object hai (normal JS object).

Express ek hi req object ko request ke pure lifecycle me share karta hai.

Tum middleware me koi property add karo → wo har aage wale middleware/route handler me available hoti hai.

👉 Short me:

req.user = decoded; sirf ek nayi property add kar raha hai req object me.

Baaki saare middlewares aur routes usi request object ko use karte hain, isliye req.user waha bhi milta hai.

// IMPORTANT OBSERVATION

🔹 Kya req.user har jagah available hoga?

Nahi.

req object ek request ke lifecycle ke liye hota hai.

Jab client ek naya request bhejta hai (e.g. /register, /login, /profile), har request ka apna naya req object banta hai.

👉 Matlab ek request ka req.user dusre request ke req me auto carry forward nahi hota.

🔹 Middleware ka role

Jo tumne middleware banaya:

export const isLoggedIn = async (req, res, next) => {
const token = req.cookies.token;
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // yaha add kiya
next();
};

Ye req.user sirf un routes me milega jaha tumne isLoggedIn middleware lagaya ho.

Agar koi route pe ye middleware nahi hai (jaise register), to us request ke req me user property kabhi add hi nahi hogi.

🔹 Example
// Protected route
app.get("/profile", isLoggedIn, (req, res) => {
res.send(req.user); // ✅ yaha available hai
});

// Public route (no middleware)
app.post("/register", (req, res) => {
console.log(req.user); // ❌ undefined (kyunki middleware nahi laga)
});

🔹 Sochne wali baat

Tumne bola:

"req phir sab jagah share hoga"

✔️ Ye baat sahi hai ki ek hi request ke andar saare middlewares aur handlers ek hi req object share karte hain.
❌ Lekin ek nayi request ke liye ek naya req object banega → isliye har route pe auto nahi milega.

👉 Short answer:

req.user sirf us request ke liye hota hai jaha isLoggedIn middleware chala ho.

register jaisa public route us middleware se nahi guzrega, isliye waha req.user undefined hoga.
