import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";


async function EditProfilePage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null; // to avoid typescript warnings
    

  if (!params.id || params.id !== user.id) {
    redirect(`/profile/${params.id}`);
    return null; // Ensure no further code execution after redirect
  }
  const userInfo = await fetchUser(params.id);



  const userData = {
    id: user.id,
    objectId: userInfo?._id,
    username: userInfo ? userInfo?.username : user.username,
    name: userInfo ? userInfo?.name : user.firstName ?? "",
    bio: userInfo ? userInfo?.bio : "",
    image: userInfo ? userInfo?.image : user.imageUrl,
  };

  return (
    <main className='mx-auto flex max-w-3xl flex-col justify-start px-10 py-20'>
      <h1 className='head-text'>Edit Profile</h1>
      <p className='mt-3 text-base-regular text-light-2'>
        Edit your profile, then hit the "Edit" button below.
      </p>

      <section className='mt-9 bg-dark-2 p-10'>
        <AccountProfile user={userData} btnTitle='Edit' />
      </section>
    </main>
  );
}

export default EditProfilePage;