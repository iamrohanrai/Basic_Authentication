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
