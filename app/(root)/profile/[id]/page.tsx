import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { profileTabs } from "@/constants";

import ThreadsTab from "@/components/shared/ThreadsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchUser, fetchUserReplies } from "@/lib/actions/user.actions";
import ProfileHeader from "@/components/shared/ProfileHeader";

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(params.id);
  if (!userInfo?.onboarded) {
    redirect("/onboarding");
    return; // Ensure no further code is executed after the redirect
  }

  const isProfileOwner = user.id === userInfo.id;


  const userReplies = await fetchUserReplies(params.id); // Fetch user replies

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
        isOwner = {isProfileOwner}
      />

      <div className='mt-9'>
        <Tabs defaultValue='threads' className='w-full'>
          <TabsList className='tab'>
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className='tab'>
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className='object-contain'
                />
                <p className='max-sm:hidden'>{tab.label}</p>

                {tab.label === "Threads" && (
                  <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                    {userInfo.threads?.length}
                  </p>
                )}
                {tab.label === "Replies" && (
                  <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                    {userReplies?.length}
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent key="content-Threads" value="threads" className='w-full text-light-1'> {/* Posts Tab Content */}
            <ThreadsTab
              currentUserId={user.id}
              accountId={userInfo.id}
              accountType='User'
            />
          </TabsContent>


          <TabsContent key="content-Replies" value="replies" className='w-full text-light-1'> {/* Replies Tab Content */}
            <ThreadsTab
              currentUserId={user.id}
              accountId={userInfo.id}
              accountType='User'
              posts={userReplies} // Pass user replies to ThreadsTab
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

export default Page;
