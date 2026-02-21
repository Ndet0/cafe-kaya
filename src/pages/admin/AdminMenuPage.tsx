import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuItem,
  getMenu,
  getMenuCategories,
  updateMenuItem,
  type MenuItemCreateInput,
} from "@/lib/api";
import { isValidImageSourceInput, normalizeImageReference } from "@/lib/utils";

const emptyMenuForm: MenuItemCreateInput = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  sort_order: 0,
  is_available: true,
};

const AdminMenuPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newCategory, setNewCategory] = useState("");
  const [menuForm, setMenuForm] = useState<MenuItemCreateInput>(emptyMenuForm);

  const { data: categories = [] } = useQuery({ queryKey: ["admin", "menu-categories"], queryFn: getMenuCategories });
  const { data: menuItems = [] } = useQuery({ queryKey: ["admin", "menu-items"], queryFn: () => getMenu() });

  const groupedItems = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      items: menuItems.filter((item) => item.category_id === category.id),
    }));
  }, [categories, menuItems]);

  const createCategoryMutation = useMutation({
    mutationFn: createMenuCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-categories"] });
      setNewCategory("");
      toast({ title: "Category added" });
    },
    onError: (error) => {
      toast({ title: "Failed to add category", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      setMenuForm((prev) => ({ ...emptyMenuForm, category_id: prev.category_id }));
      toast({ title: "Menu item created" });
    },
    onError: (error) => {
      toast({ title: "Could not create menu item", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateMenuItem(id, { is_available: next }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
    },
    onError: (error) => {
      toast({ title: "Could not update availability", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast({ title: "Menu item removed" });
    },
    onError: (error) => {
      toast({ title: "Could not delete item", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const handleCreateItem = () => {
    const rawImage = menuForm.image_url?.trim() ?? "";
    if (rawImage && !isValidImageSourceInput(rawImage)) {
      toast({
        title: "Invalid image URL",
        description: "Use an absolute URL (https://...) or a public path like /coffee.jpeg",
        variant: "destructive",
      });
      return;
    }

    createItemMutation.mutate({
      ...menuForm,
      image_url: rawImage ? normalizeImageReference(rawImage) : "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add category</CardTitle>
            <CardDescription>Create a new menu category for grouping dishes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category name</Label>
              <Input
                id="category-name"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Breakfast"
              />
            </div>
            <Button
              type="button"
              onClick={() => createCategoryMutation.mutate({ name: newCategory.trim(), sort_order: categories.length })}
              disabled={!newCategory.trim() || createCategoryMutation.isPending}
              className="w-fit"
            >
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add menu item</CardTitle>
            <CardDescription>Create a dish and publish immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={menuForm.name}
                  onChange={(event) => setMenuForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Chicken Pilau"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Price</Label>
                <Input
                  id="item-price"
                  value={menuForm.price}
                  onChange={(event) => setMenuForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="850"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Select
                value={menuForm.category_id}
                onValueChange={(value) => setMenuForm((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger id="item-category">
                  <SelectValue placeholder={categories.length ? "Select a category" : "Create a category first"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={menuForm.description ?? ""}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Fragrant spiced rice with tender chicken"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                value={menuForm.image_url ?? ""}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, image_url: event.target.value }))}
                placeholder="https://..."
              />
            </div>

            <Button
              type="button"
              onClick={handleCreateItem}
              disabled={
                createItemMutation.isPending ||
                !menuForm.name.trim() ||
                !menuForm.price.trim() ||
                !menuForm.category_id
              }
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu inventory</CardTitle>
          <CardDescription>Toggle availability or remove outdated dishes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedItems.map((group) => (
            <div key={group.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{group.name}</h3>
                <Badge variant="outline">{group.items.length} items</Badge>
              </div>

              <div className="space-y-2">
                {group.items.length === 0 && <p className="text-sm text-muted-foreground">No items in this category.</p>}
                {group.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">KES {item.price}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`available-${item.id}`} className="text-xs">Available</Label>
                        <Switch
                          id={`available-${item.id}`}
                          checked={item.is_available}
                          onCheckedChange={(next) => toggleAvailabilityMutation.mutate({ id: item.id, next })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMenuPage;
