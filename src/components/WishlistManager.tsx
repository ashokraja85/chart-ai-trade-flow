import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Plus, Edit3, Trash2, Search, X } from "lucide-react";
import { useWishlists, Wishlist, WishlistStock, Stock } from "@/hooks/useWishlists";
import { useToast } from "@/hooks/use-toast";

export const WishlistManager = () => {
  const { 
    loading, 
    error, 
    searchStocks, 
    getUserWishlists, 
    createWishlist, 
    updateWishlist, 
    deleteWishlist,
    getWishlistStocks,
    addStockToWishlist,
    removeStockFromWishlist 
  } = useWishlists();
  const { toast } = useToast();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlist, setActiveWishlist] = useState<string | null>(null);
  const [wishlistStocks, setWishlistStocks] = useState<WishlistStock[]>([]);
  const [stockSearchResults, setStockSearchResults] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddStockPopover, setShowAddStockPopover] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const [newWishlistName, setNewWishlistName] = useState("");

  const loadWishlists = async () => {
    try {
      console.log('Loading wishlists...');
      const data = await getUserWishlists();
      console.log('Wishlists loaded:', data);
      setWishlists(data);
      if (data.length > 0 && !activeWishlist) {
        setActiveWishlist(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load wishlists:', err);
    }
  };

  const loadWishlistStocks = async (wishlistId: string) => {
    try {
      const data = await getWishlistStocks(wishlistId);
      setWishlistStocks(data);
    } catch (err) {
      console.error('Failed to load wishlist stocks:', err);
    }
  };

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      const newWishlist = await createWishlist(newWishlistName);
      setWishlists([...wishlists, newWishlist]);
      setActiveWishlist(newWishlist.id);
      setNewWishlistName("");
      setShowCreateDialog(false);
      toast({
        title: "Wishlist Created",
        description: `"${newWishlistName}" has been created successfully.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create wishlist",
        variant: "destructive"
      });
    }
  };

  const handleUpdateWishlist = async () => {
    if (!editingWishlist || !newWishlistName.trim()) return;

    try {
      const updatedWishlist = await updateWishlist(editingWishlist.id, newWishlistName);
      setWishlists(wishlists.map(w => w.id === updatedWishlist.id ? updatedWishlist : w));
      setNewWishlistName("");
      setEditingWishlist(null);
      setShowEditDialog(false);
      toast({
        title: "Wishlist Updated",
        description: "Wishlist name has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update wishlist",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWishlist = async (wishlistId: string) => {
    try {
      await deleteWishlist(wishlistId);
      const updatedWishlists = wishlists.filter(w => w.id !== wishlistId);
      setWishlists(updatedWishlists);
      if (activeWishlist === wishlistId) {
        setActiveWishlist(updatedWishlists.length > 0 ? updatedWishlists[0].id : null);
      }
      toast({
        title: "Wishlist Deleted",
        description: "Wishlist has been deleted successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete wishlist",
        variant: "destructive"
      });
    }
  };

  const handleSearchStocks = async (query: string) => {
    if (query.trim().length < 2) {
      setStockSearchResults([]);
      return;
    }

    try {
      const results = await searchStocks(query);
      setStockSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleAddStock = async (stock: Stock) => {
    if (!activeWishlist) return;

    try {
      await addStockToWishlist(activeWishlist, stock.symbol);
      await loadWishlistStocks(activeWishlist);
      setShowAddStockPopover(false);
      setSearchQuery("");
      setStockSearchResults([]);
      toast({
        title: "Stock Added",
        description: `${stock.symbol} has been added to your wishlist.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add stock",
        variant: "destructive"
      });
    }
  };

  const handleRemoveStock = async (wishlistStockId: string, stockSymbol: string) => {
    try {
      await removeStockFromWishlist(wishlistStockId);
      setWishlistStocks(wishlistStocks.filter(ws => ws.id !== wishlistStockId));
      toast({
        title: "Stock Removed",
        description: `${stockSymbol} has been removed from your wishlist.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove stock",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadWishlists();
  }, []);

  useEffect(() => {
    if (activeWishlist) {
      loadWishlistStocks(activeWishlist);
    }
  }, [activeWishlist]);

  const currentWishlist = wishlists.find(w => w.id === activeWishlist);
  const canCreateWishlist = wishlists.length < 3;
  const canAddStock = wishlistStocks.length < 50;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5" />
            My Wishlists
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {wishlists.length}/3 Lists
            </Badge>
            {canCreateWishlist && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    New List
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Wishlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="wishlist-name" className="text-slate-300">Wishlist Name</Label>
                      <Input
                        id="wishlist-name"
                        value={newWishlistName}
                        onChange={(e) => setNewWishlistName(e.target.value)}
                        placeholder="Enter wishlist name"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateWishlist} disabled={!newWishlistName.trim()}>
                      Create Wishlist
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {wishlists.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No wishlists created yet</p>
          </div>
        ) : (
          <Tabs value={activeWishlist || ""} onValueChange={setActiveWishlist}>
            <TabsList className="grid w-full bg-slate-700" style={{ gridTemplateColumns: `repeat(${wishlists.length}, 1fr)` }}>
              {wishlists.map((wishlist) => (
                <TabsTrigger 
                  key={wishlist.id} 
                  value={wishlist.id}
                  className="data-[state=active]:bg-slate-600 text-slate-300 relative group"
                >
                  <span className="truncate max-w-20">{wishlist.name}</span>
                  <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWishlist(wishlist);
                        setNewWishlistName(wishlist.name);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWishlist(wishlist.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {wishlists.map((wishlist) => (
              <TabsContent key={wishlist.id} value={wishlist.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300">
                    <h3 className="font-medium">{wishlist.name}</h3>
                    <p className="text-sm text-slate-400">
                      {wishlistStocks.length}/50 stocks
                    </p>
                  </div>
                  {canAddStock && (
                    <Popover open={showAddStockPopover} onOpenChange={setShowAddStockPopover}>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Stock
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-slate-800 border-slate-700" align="end">
                        <Command className="bg-slate-800">
                          <CommandInput
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onValueChange={(value) => {
                              setSearchQuery(value);
                              handleSearchStocks(value);
                            }}
                            className="bg-slate-700 border-slate-600"
                          />
                          <CommandList>
                            <CommandEmpty>No stocks found.</CommandEmpty>
                            <CommandGroup>
                              {stockSearchResults.map((stock) => (
                                <CommandItem
                                  key={stock.symbol}
                                  onSelect={() => handleAddStock(stock)}
                                  className="hover:bg-slate-700"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <div className="font-medium text-white">{stock.symbol}</div>
                                      <div className="text-sm text-slate-400">{stock.name}</div>
                                    </div>
                                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                                      {stock.exchange}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-2">
                  {wishlistStocks.map((ws) => (
                    <div key={ws.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-white">{ws.stock_symbol}</div>
                          <div className="text-sm text-slate-400">{ws.stock?.name}</div>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {ws.stock?.exchange}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-900/20"
                        onClick={() => handleRemoveStock(ws.id, ws.stock_symbol)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Wishlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-wishlist-name" className="text-slate-300">Wishlist Name</Label>
                <Input
                  id="edit-wishlist-name"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="Enter wishlist name"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateWishlist} disabled={!newWishlistName.trim()}>
                Update Wishlist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};