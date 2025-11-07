import omise from "omise";

const omiseClient = omise({
    secretKey: process.env.OMISE_SECRET_KEY,
    publicKey: process.env.OMISE_PUBLIC_KEY,
});

export default omiseClient;