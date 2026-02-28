import LoadingCard from "@/components/ui/LoadingCard";

const BlogLoadingPage = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default BlogLoadingPage;
