<script lang="ts">
    import SidebarWrapper from "$lib/components/sidebarWrapper.svelte";

    export let data: { item: any };
    const { item } = data;
</script>

<SidebarWrapper> 
<div>
    <h1>{item.title}</h1>
    <div>Price: ${item.price}</div>
    <div>Condition: {item.condition}</div>
    <div>Seller: {item.sellerName}</div>
    <div>Shipping: {item.shipping}</div>
    <div>Time Remaining: {item.timeRemaining}</div>
    <div>
        <a href={item.link} target="_blank">View on eBay</a>
    </div>
    <div>
        <img src={item.thumbnail} alt="Photograph of the item" />
    </div>
</div>
</SidebarWrapper>